import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const supabase = await createClient();

    // 1. Save to Supabase (Database)
    const { error: dbError } = await supabase.from("contacts").insert([
      {
        name: data.name,
        email: data.email,
        category: data.category,
        subject: data.subject,
        message: data.message,
      },
    ]);

    if (dbError) {
      console.error("Supabase Insert Error:", dbError);
    }

    // 2. Send Email Notification via Resend
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      try {
        // Adjust the from/to emails as needed based on your domain verification in Resend
        await resend.emails.send({
          from: "Gonsuit Trend Intelligence <info@gonsuit.com>", // You must verify gonsuit.com in your Resend account to use this!
          to: "trend@gonsuit.com", 
          replyTo: data.email, // Replies go straight to the user
          subject: `[트렌드 스카우터 문의] ${data.subject}`,
          html: `
            <h3>새로운 비즈니스 문의/피드백이 접수되었습니다.</h3>
            <p><strong>이름/회사명:</strong> ${data.name}</p>
            <p><strong>이메일:</strong> ${data.email}</p>
            <p><strong>분류:</strong> ${data.category}</p>
            <p><strong>제목:</strong> ${data.subject}</p>
            <hr />
            <p><strong>내용:</strong></p>
            <div style="white-space: pre-wrap; background: #f9f9f9; padding: 15px; border-radius: 8px;">${data.message}</div>
          `,
        });
      } catch (mailError: any) {
        console.error("Resend Email Exception:", mailError);
        // We log the error but still return success to the user so they aren't blocked, since it's already saved in Supabase
      }
    } else {
      console.warn("RESEND_API_KEY is missing. Email was not sent, but data was stored in DB.");
    }

    return NextResponse.json({ success: true, message: "Inquiry received" });
  } catch (error: any) {
    console.error("Contact API Server Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal Server Error"
      },
      { status: 500 }
    );
  }
}
