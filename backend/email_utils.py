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
    # Development fallback print
    print(f"[OTP FOR {receiver_email}]: {otp}")

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

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.sendmail(SENDER_EMAIL, receiver_email, message.as_string())
    except Exception as e:
        print(f"SMTP Error: {e}")