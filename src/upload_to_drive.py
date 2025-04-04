from __future__ import print_function
import os.path
import smtplib
from email.mime.text import MIMEText
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

# 🔐 Google Drive 권한
SCOPES = ['https://www.googleapis.com/auth/drive.file']

# 📁 Google Drive 폴더 ID (BYUL_Backup)
FOLDER_ID = '1czSKDd0QrVdobRrDY7ZpELph8npstJhm'

# 📩 이메일 알림 함수

def send_email_alert(file_name):
    sender = 'gun@wisebirds.jp'              # 보내는 이메일 주소
    receiver = 'gun@wisebirds.jp'          # 알림 받을 이메일 주소
    app_password = 'hrnpyhkreuqobjly'         # 앱 비밀번호 (16자리, 띄어쓰기 없이 붙여도 OK)

    subject = '✅ 백업 완료 알림'
    body = f'📦 백업 파일 "{file_name}" 이(가) Google Drive에 업로드되었습니다.'

    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = sender
    msg['To'] = receiver

    try:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(sender, app_password)
        server.sendmail(sender, receiver, msg.as_string())
        server.quit()
        print("📩 이메일 알림 전송 완료")
    except Exception as e:
        print("❌ 이메일 알림 전송 실패:", e)

# ☁️ Google Drive 업로드 함수
def upload_latest_zip():
    zip_files = [f for f in os.listdir() if f.endswith(".zip")]
    if not zip_files:
        print("❌ ZIP 파일이 없습니다.")
        return
    latest_zip = max(zip_files, key=os.path.getctime)

    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    service = build('drive', 'v3', credentials=creds)

    file_metadata = {
        'name': latest_zip,
        'parents': [FOLDER_ID]
    }
    media = MediaFileUpload(latest_zip, mimetype='application/zip')
    file = service.files().create(body=file_metadata, media_body=media, fields='id').execute()

    print(f"✅ 업로드 완료: {latest_zip} (File ID: {file.get('id')})")
    send_email_alert(latest_zip)

# ▶️ 실행
if __name__ == '__main__':
    upload_latest_zip()
