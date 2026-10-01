import os
import random
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD")

def send_otp_email(receiver_email: str, otp: str):
    # Always print OTP to console/logs so you can test instantly even if SMTP fails
    print(f"\n========================================")
    print(f"[OTP FOR {receiver_email}]: {otp}")
    print(f"========================================\n")

    if not SENDER_EMAIL or not SENDER_PASSWORD:
        print("SMTP credentials not provided. Skipping email send.")
        return

    try:
        message = MIMEMultipart("alternative")
        message["Subject"] = "BTechBuddy - Email Verification OTP"
        message["From"] = SENDER_EMAIL
        message["To"] = receiver_email

        html = f"""
        <html>
          <body>
            <h2>Welcome to BTechBuddy!</h2>
            <p>Your verification code is:</p>
            <h1 style="color: #4CAF50;">{otp}</h1>
            <p>This code will expire in 10 minutes.</p>
          </body>
        </html>
        """
        message.attach(MIMEText(html, "html"))

        # Added timeout=3 seconds so it never hangs or stays 'Pending' on cloud servers
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=3) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.sendmail(SENDER_EMAIL, receiver_email, message.as_string())
            print(f"OTP email successfully sent to {receiver_email}")
    except Exception as e:
        print(f"SMTP Error (Non-blocking): {e}")