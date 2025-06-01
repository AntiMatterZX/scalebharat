export function newMatchTemplate(data: Record<string, any>): string {
  const { userName, matchScore, type, matchName, matchDescription } = data

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Match Notification</title>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        background-color: #4f46e5;
        color: white;
        padding: 20px;
        text-align: center;
        border-radius: 5px 5px 0 0;
      }
      .content {
        background-color: #f9fafb;
        padding: 20px;
        border-radius: 0 0 5px 5px;
        border: 1px solid #e5e7eb;
        border-top: none;
      }
      .match-score {
        font-size: 24px;
        font-weight: bold;
        color: #4f46e5;
        text-align: center;
        margin: 20px 0;
      }
      .button {
        display: inline-block;
        background-color: #4f46e5;
        color: white;
        text-decoration: none;
        padding: 10px 20px;
        border-radius: 5px;
        margin-top: 20px;
      }
      .footer {
        text-align: center;
        margin-top: 20px;
        font-size: 12px;
        color: #6b7280;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>New Match Found!</h1>
      </div>
      <div class="content">
        <p>Hello ${userName},</p>
        <p>We're excited to inform you that we've found a new ${type === "startup" ? "investor" : "startup"} match for you!</p>
        
        ${matchName ? `<h2>${matchName}</h2>` : ""}
        ${matchDescription ? `<p>${matchDescription}</p>` : ""}
        
        <div class="match-score">
          Match Score: ${matchScore}%
        </div>
        
        <p>This match was calculated based on your profile preferences and requirements. We believe this could be a great opportunity for you!</p>
        
        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/matches" class="button">View Your Match</a>
        </p>
        
        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        
        <p>Best regards,<br>The Startup Directory Team</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Startup Directory. All rights reserved.</p>
        <p>If you no longer wish to receive these emails, you can <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications">update your notification preferences</a>.</p>
      </div>
    </div>
  </body>
  </html>
  `
}
