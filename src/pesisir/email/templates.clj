(ns pesisir.email.templates
  "Email template generation")

;; ============================================================================
;; Constants
;; ============================================================================

(def APP_NAME "Pesisir")
(def APP_URL (or (System/getenv "APP_URL") "http://localhost:3000"))
(def SUPPORT_EMAIL (or (System/getenv "SUPPORT_EMAIL") "support@pesisir.local"))

;; ============================================================================
;; HTML Template Wrapper
;; ============================================================================

(defn html-wrapper
  "Wrap content in HTML email template"
  [content]
  (str "<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1a202c; color: #fff; padding: 20px; text-align: center; border-radius: 4px 4px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background-color: #f7fafc; padding: 20px; }
        .footer { background-color: #2d3748; color: #a0aec0; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 4px 4px; }
        .button { display: inline-block; background-color: #3182ce; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .button:hover { background-color: #2c5aa0; }
        p { margin: 10px 0; }
        .divider { border-top: 1px solid #e2e8f0; margin: 20px 0; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>" APP_NAME "</h1>
        </div>
        <div class='content'>
            " content "
        </div>
        <div class='footer'>
            <p>&copy; 2025 " APP_NAME ". All rights reserved.</p>
            <p><a href='mailto:" SUPPORT_EMAIL "'>Contact Support</a></p>
        </div>
    </div>
</body>
</html>"))

;; ============================================================================
;; Email Verification Template
;; ============================================================================

(defn verification-email
  "Email for verifying user account"
  [user-name verification-token]
  (let [verification-url (str APP_URL "/verify-email?token=" verification-token)
        content (str "<h2>Welcome to " APP_NAME "!</h2>
<p>Hi " user-name ",</p>
<p>Thank you for creating an account. Please verify your email address by clicking the button below:</p>
<p><a href='" verification-url "' class='button'>Verify Email</a></p>
<p>Or copy and paste this link in your browser:</p>
<p><code>" verification-url "</code></p>
<p>This link will expire in 24 hours.</p>
<div class='divider'></div>
<p>If you didn't create this account, please ignore this email.</p>")
        html (html-wrapper content)
        text (str "Welcome to " APP_NAME "!\n\n"
                  "Hi " user-name ",\n\n"
                  "Thank you for creating an account. Please verify your email address by visiting this link:\n"
                  verification-url "\n\n"
                  "This link will expire in 24 hours.\n\n"
                  "If you didn't create this account, please ignore this email.")]
    {:html html :text text}))

;; ============================================================================
;; Welcome Email Template
;; ============================================================================

(defn welcome-email
  "Welcome email after account verification"
  [user-name]
  (let [content (str "<h2>Welcome to " APP_NAME "!</h2>
<p>Hi " user-name ",</p>
<p>Your email has been verified and your account is now active.</p>
<p>You can now start using " APP_NAME " by logging into your account.</p>
<p><a href='" APP_URL "/login' class='button'>Log In</a></p>
<div class='divider'></div>
<p>If you have any questions, please contact our support team.</p>")
        html (html-wrapper content)
        text (str "Welcome to " APP_NAME "!\n\n"
                  "Hi " user-name ",\n\n"
                  "Your email has been verified and your account is now active.\n"
                  "You can now start using " APP_NAME " by logging into your account.\n\n"
                  "If you have any questions, please contact our support team.")]
    {:html html :text text}))

;; ============================================================================
;; Password Reset Template
;; ============================================================================

(defn password-reset-email
  "Email with password reset link"
  [user-name reset-token]
  (let [reset-url (str APP_URL "/reset-password?token=" reset-token)
        content (str "<h2>Reset Your Password</h2>
<p>Hi " user-name ",</p>
<p>We received a request to reset your password. Click the button below to reset it:</p>
<p><a href='" reset-url "' class='button'>Reset Password</a></p>
<p>Or copy and paste this link in your browser:</p>
<p><code>" reset-url "</code></p>
<p>This link will expire in 1 hour.</p>
<div class='divider'></div>
<p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>")
        html (html-wrapper content)
        text (str "Reset Your Password\n\n"
                  "Hi " user-name ",\n\n"
                  "We received a request to reset your password. Visit this link to reset it:\n"
                  reset-url "\n\n"
                  "This link will expire in 1 hour.\n\n"
                  "If you didn't request a password reset, please ignore this email.")]
    {:html html :text text}))

;; ============================================================================
;; Password Changed Confirmation Template
;; ============================================================================

(defn password-changed-email
  "Confirmation that password has been changed"
  [user-name]
  (let [content (str "<h2>Password Changed</h2>
<p>Hi " user-name ",</p>
<p>Your password has been successfully changed.</p>
<p>If you didn't make this change, please <a href='mailto:" SUPPORT_EMAIL "'>contact our support team</a> immediately.</p>")
        html (html-wrapper content)
        text (str "Password Changed\n\n"
                  "Hi " user-name ",\n\n"
                  "Your password has been successfully changed.\n"
                  "If you didn't make this change, please contact our support team immediately.")]
    {:html html :text text}))

;; ============================================================================
;; Login Alert Template
;; ============================================================================

(defn login-alert-email
  "Alert for new login to account"
  [user-name ip-address user-agent]
  (let [content (str "<h2>New Login Alert</h2>
<p>Hi " user-name ",</p>
<p>A new login to your " APP_NAME " account was detected:</p>
<ul>
<li><strong>IP Address:</strong> " ip-address "</li>
<li><strong>Device:</strong> " user-agent "</li>
<li><strong>Time:</strong> " (java.time.Instant/now) "</li>
</ul>
<p>If this wasn't you, please <a href='mailto:" SUPPORT_EMAIL "'>contact our support team</a> immediately.</p>")
        html (html-wrapper content)
        text (str "New Login Alert\n\n"
                  "Hi " user-name ",\n\n"
                  "A new login to your " APP_NAME " account was detected:\n"
                  "IP Address: " ip-address "\n"
                  "Device: " user-agent "\n"
                  "Time: " (java.time.Instant/now) "\n\n"
                  "If this wasn't you, please contact our support team immediately.")]
    {:html html :text text}))
