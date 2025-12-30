(ns pesisir.email.service
  "Email service for sending emails"
  (:require [postal.core :as postal]
            [pesisir.email.templates :as templates]
            [taoensso.timbre :as log]))

;; ============================================================================
;; Email Configuration
;; ============================================================================

(defn get-smtp-config
  "Load SMTP configuration from environment or config"
  []
  (let [smtp-host (or (System/getenv "SMTP_HOST") "localhost")
        smtp-port (or (System/getenv "SMTP_PORT") "1025")
        smtp-user (System/getenv "SMTP_USER")
        smtp-pass (System/getenv "SMTP_PASSWORD")
        from-email (or (System/getenv "FROM_EMAIL") "noreply@pesisir.local")]
    {:host smtp-host
     :port (Integer/parseInt smtp-port)
     :user smtp-user
     :pass smtp-pass
     :from from-email
     :tls false}))

(defn get-from-email
  "Get the from email address"
  []
  (or (System/getenv "FROM_EMAIL") "noreply@pesisir.local"))

;; ============================================================================
;; Email Sending
;; ============================================================================

(defn send-email
  "Send an email
   Args:
     - to: recipient email address
     - subject: email subject
     - body: email body (can be HTML)
     - text: plain text version (optional)
   Returns: true if successful, false otherwise"
  [to subject body & {:keys [text html]}]
  (try
    (let [config (get-smtp-config)
          from (get-from-email)
          message {:from from
                   :to to
                   :subject subject
                   :body (cond
                           html [{:type "text/html; charset=utf-8"
                                  :content body}]
                           text [{:type "text/plain"
                                  :content text}
                                 {:type "text/html; charset=utf-8"
                                  :content body}]
                           :else body)}]
      (postal/send-message config message)
      (log/info "Email sent successfully" {:to to :subject subject})
      true)
    (catch Exception e
      (log/error "Failed to send email" {:to to :subject subject :error (.getMessage e)})
      false)))

;; ============================================================================
;; Specific Email Types
;; ============================================================================

(defn send-verification-email
  "Send email verification link to user"
  [user-email user-name verification-token]
  (let [subject "Verify your Pesisir account"
        {:keys [html text]} (templates/verification-email user-name verification-token)]
    (send-email user-email subject html :text text)))

(defn send-welcome-email
  "Send welcome email to new user"
  [user-email user-name]
  (let [subject "Welcome to Pesisir"
        {:keys [html text]} (templates/welcome-email user-name)]
    (send-email user-email subject html :text text)))

(defn send-password-reset-email
  "Send password reset link to user"
  [user-email user-name reset-token]
  (let [subject "Reset your Pesisir password"
        {:keys [html text]} (templates/password-reset-email user-name reset-token)]
    (send-email user-email subject html :text text)))

(defn send-password-changed-email
  "Send confirmation that password has been changed"
  [user-email user-name]
  (let [subject "Your Pesisir password has been changed"
        {:keys [html text]} (templates/password-changed-email user-name)]
    (send-email user-email subject html :text text)))

(defn send-login-alert-email
  "Send new login alert to user"
  [user-email user-name ip-address user-agent]
  (let [subject "New login to your Pesisir account"
        {:keys [html text]} (templates/login-alert-email user-name ip-address user-agent)]
    (send-email user-email subject html :text text)))

;; ============================================================================
;; Email Status Checking
;; ============================================================================

(defn can-send-emails?
  "Check if email service is configured and available"
  []
  (try
    (let [config (get-smtp-config)]
      (and (:host config) (> (:port config) 0)))
    (catch Exception _
      false)))

(defn get-email-config-status
  "Get status of email configuration"
  []
  (let [config (get-smtp-config)
        smtp-host (System/getenv "SMTP_HOST")]
    {:smtp-configured (some? smtp-host)
     :smtp-host (get config :host "localhost")
     :smtp-port (get config :port 1025)
     :from-email (get-from-email)
     :can-send (can-send-emails?)}))
