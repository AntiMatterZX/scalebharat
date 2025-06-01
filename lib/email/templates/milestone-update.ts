export function milestoneUpdateTemplate(data: Record<string, any>): string {
  const { userName, startupName, milestoneName, milestoneDescription, startupProfileLink } = data

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Startup Milestone Update</title>
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
      .milestone {
        background-color: #f0f9ff;
        border: 1px solid #bae6fd;
        padding: 15px;
        border-radius: 5px;
        margin: 20px 0;
      }
      .milestone-title {
        color: #0369a1;
        font-weight: bold;
        font-size: 18px;
        margin-bottom: 10px;
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
        <h1>Startup Milestone Update</h1>
      </div>
      <div class="content">
        <p>Hello ${userName},</p>
        <p>${startupName} has reached a new milestone!</p>
        
        <div class="milestone">
          <div class="milestone-title">${milestoneName}</div>
          <p>${milestoneDescription}</p>
        </div>
        
        <p>Stay updated on their progress and see how they're growing.</p>
        
        <p>
          <a href="${startupProfileLink}" class="button">View Startup Profile</a>
        </p>
        
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
