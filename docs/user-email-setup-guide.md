# Personal Email Setup Guide

Configure your personal SMTP/IMAP settings so you can send emails from your own email account when communicating with clients and vendors.

---

## Step 1: Prepare Your Email Account

### Gmail

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Navigate to **Security** > **2-Step Verification** > Enable it
3. After enabling, go to **Security** > **App Passwords**
   - Or visit: `myaccount.google.com/apppasswords`
4. Select app name (e.g. "SwagSuite") > Click **Generate**
5. Copy the 16-character password (e.g. `abcd efgh ijkl mnop`)
6. Use the following settings:

| Field | Value |
|-------|-------|
| SMTP Server | `smtp.gmail.com` |
| SMTP Port | `465` |
| IMAP Server | `imap.gmail.com` |
| IMAP Port | `993` |
| Username | Your full Gmail address |
| Password | The 16-character App Password |

> **Important:** Do not use your regular Gmail password. Only App Passwords work for SMTP/IMAP.

---

### Outlook / Office 365

1. If your organization uses **Modern Authentication**, you may need admin approval
2. Go to [account.microsoft.com/security](https://account.microsoft.com/security)
3. Enable **2-Step Verification** if not already enabled
4. Generate an **App Password** under Security settings
5. Use the following settings:

| Field | Value |
|-------|-------|
| SMTP Server | `smtp.office365.com` |
| SMTP Port | `587` |
| IMAP Server | `outlook.office365.com` |
| IMAP Port | `993` |
| Username | Your full Outlook/Office 365 email |
| Password | App Password |

---

### Custom / Company SMTP

Contact your IT administrator for:
- SMTP/IMAP server addresses
- Port numbers (common: SMTP `465` or `587`, IMAP `993`)
- Whether to use SSL/TLS
- Credentials (username and password)

---

## Step 2: Configure in SwagSuite

1. Log in to SwagSuite
2. Go to **Settings** (gear icon in sidebar)
3. Click the **Email Config** tab
4. Click the **SMTP/IMAP Config** button (teal button, top right)
5. The **Mail Credentials** dialog will open

### Fill in SMTP Settings (for sending emails)

- **SMTP Server** - e.g. `smtp.gmail.com`
- **SMTP Port** - e.g. `465`
- **SMTP Username** - Your full email address
- **SMTP Password** - Your App Password (not your regular password)

### Fill in IMAP Settings (for receiving emails)

- **IMAP Server** - e.g. `imap.gmail.com`
- **IMAP Port** - e.g. `993`
- **IMAP Username** - Your full email address
- **IMAP Password** - Same App Password as SMTP

### Test Your Connection

- Click **Test SMTP** to verify your sending configuration
- Click **Test IMAP** to verify your receiving configuration
- You should see a green "Connected" toast notification

### Checkbox Options

| Checkbox | What it does |
|----------|-------------|
| **Primary** | Marks this as your default email for receiving system notifications |
| **Always use the default account when composing** | If checked, your personal SMTP is **ignored** and the system-wide email is used instead. **Uncheck this** if you want to send from your own account |
| **Do not use my name while sending** | If checked, emails are sent with "SwagSuite" as the sender name instead of your name |

> **Important:** Make sure "Always use the default account when composing" is **unchecked** if you want emails to be sent from your personal email account.

6. Click **SAVE**

---

## Step 3: Sending Emails

Once configured, when you send emails from:
- **Order Communication tab** (Client or Vendor emails)

The system will automatically use your personal SMTP account. Recipients will see your email address as the sender.

If you have not configured personal SMTP settings, the system will fall back to the company-wide email configuration.

---

## Troubleshooting

### "Sending from domain X is not allowed"
- Make sure "Always use the default account when composing" is **unchecked**
- The FROM address must match your SMTP account's email domain

### "Authentication failed"
- Double-check your App Password (not your regular password)
- For Gmail: Make sure 2-Step Verification is enabled
- For Outlook: Make sure App Passwords are allowed by your admin

### "Connection timeout"
- Verify the SMTP/IMAP server addresses are correct
- Check if your network/firewall blocks the required ports (465, 587, 993)
- Try port `587` instead of `465` for SMTP (or vice versa)

### "Test SMTP works but sending fails"
- Restart the application after saving new credentials
- Check server logs for detailed error messages

### Gmail-specific: "App Passwords not available"
- 2-Step Verification must be enabled first
- Google Workspace accounts may need admin to enable App Passwords
- Check if your organization has disabled "Less secure app access"
