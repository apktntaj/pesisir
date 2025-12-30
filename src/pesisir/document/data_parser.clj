(ns pesisir.document.data-parser
  "Parse structured data from extracted PDF text
   
   This module extracts key information from BOL, CI, and PL documents
   for generating customs declarations (BC 1.1, BC 2.3, BC 3.0)"
  (:require [clojure.string :as str]
            [taoensso.timbre :as log]))

;; ============================================================================
;; Utility Functions
;; ============================================================================

(defn extract-field
  "Extract a field value using regex pattern
   
   Args:
     text - Full text to search
     pattern - Regex pattern with one capture group
   
   Returns:
     Extracted value or nil"
  [text pattern]
  (when-let [match (re-find pattern text)]
    (str/trim (second match))))

(defn extract-date
  "Extract date in various formats"
  [text label]
  (let [patterns [(re-pattern (str label "\\s*:?\\s*(\\d{2}[-/]\\d{2}[-/]\\d{4})"))
                  (re-pattern (str label "\\s*:?\\s*(\\d{4}[-/]\\d{2}[-/]\\d{2})"))]]
    (some #(extract-field text %) patterns)))

;; ============================================================================
;; Bill of Lading (BOL) Parser
;; ============================================================================

(defn parse-bill-of-lading
  "Parse Bill of Lading document
   
   Extracts: BL Number, Vessel, Voyage, Port of Loading, Port of Discharge,
            Shipper, Consignee, Notify Party, Container Numbers, etc."
  [text]
  (try
    {:document-type :bill-of-lading
     :bl-number (extract-field text #"(?i)B/?L\s*(?:No|Number)[:\s]+([\w\d-]+)")
     :vessel-name (extract-field text #"(?i)Vessel[:\s]+([A-Z0-9\s]+?)(?:\n|Port)")
     :voyage-number (extract-field text #"(?i)Voyage[:\s]+([\w\d-]+)")
     :port-of-loading (extract-field text #"(?i)Port of (?:Loading|Departure)[:\s]+([A-Z\s,]+?)(?:\n|$)")
     :port-of-discharge (extract-field text #"(?i)Port of (?:Discharge|Arrival)[:\s]+([A-Z\s,]+?)(?:\n|$)")
     :shipper (extract-field text #"(?i)Shipper[:\s]+([^\n]+)")
     :consignee (extract-field text #"(?i)Consignee[:\s]+([^\n]+)")
     :notify-party (extract-field text #"(?i)Notify Party[:\s]+([^\n]+)")
     :container-numbers (re-seq #"\b[A-Z]{4}\d{7}\b" text)
     :date-of-issue (extract-date text "Date of Issue")
     :place-of-issue (extract-field text #"(?i)Place of Issue[:\s]+([^\n]+)")}
    (catch Exception e
      (log/error "BOL parsing failed" {:error (.getMessage e)})
      {:error (.getMessage e)})))

;; ============================================================================
;; Commercial Invoice (CI) Parser
;; ============================================================================

(defn parse-commercial-invoice
  "Parse Commercial Invoice document
   
   Extracts: Invoice Number, Date, Seller, Buyer, Total Amount, Currency,
            Payment Terms, Incoterms, etc."
  [text]
  (try
    {:document-type :commercial-invoice
     :invoice-number (extract-field text #"(?i)Invoice\s*(?:No|Number)[:\s]+([\w\d-/]+)")
     :invoice-date (extract-date text "(?:Invoice )?Date")
     :seller (extract-field text #"(?i)(?:Seller|From)[:\s]+([^\n]+)")
     :buyer (extract-field text #"(?i)(?:Buyer|To|Bill To)[:\s]+([^\n]+)")
     :total-amount (extract-field text #"(?i)Total[:\s]+(?:[A-Z]{3})?\s*([\d,]+\.?\d*)")
     :currency (or (extract-field text #"(?i)Currency[:\s]+([A-Z]{3})")
                   (extract-field text #"\b(USD|EUR|IDR|SGD|CNY)\b"))
     :payment-terms (extract-field text #"(?i)Payment Terms?[:\s]+([^\n]+)")
     :incoterms (extract-field text #"\b(FOB|CIF|EXW|FCA|CPT|CIP|DAP|DDP)\b")}
    (catch Exception e
      (log/error "CI parsing failed" {:error (.getMessage e)})
      {:error (.getMessage e)})))

;; ============================================================================
;; Packing List (PL) Parser
;; ============================================================================

(defn parse-packing-list
  "Parse Packing List document
   
   Extracts: Packing List Number, Date, Total Packages, Net Weight, Gross Weight,
            Container Details, etc."
  [text]
  (try
    {:document-type :packing-list
     :packing-list-number (extract-field text #"(?i)Packing List\s*(?:No|Number)[:\s]+([\w\d-/]+)")
     :packing-date (extract-date text "Date")
     :total-packages (extract-field text #"(?i)Total (?:Packages|Cartons)[:\s]+([\d,]+)")
     :net-weight (extract-field text #"(?i)Net Weight[:\s]+([\d,]+\.?\d*)\s*(?:kg|KG)?")
     :gross-weight (extract-field text #"(?i)Gross Weight[:\s]+([\d,]+\.?\d*)\s*(?:kg|KG)?")
     :volume (extract-field text #"(?i)Volume[:\s]+([\d,]+\.?\d*)\s*(?:CBM|m3)?")
     :container-numbers (re-seq #"\b[A-Z]{4}\d{7}\b" text)
     :marks-numbers (extract-field text #"(?i)Marks? (?:and|&) Numbers?[:\s]+([^\n]+)")}
    (catch Exception e
      (log/error "PL parsing failed" {:error (.getMessage e)})
      {:error (.getMessage e)})))

;; ============================================================================
;; Main Parser Function
;; ============================================================================

(defn parse-document
  "Parse document based on detected type
   
   Args:
     text - Extracted PDF text
     document-type - One of :bill-of-lading, :commercial-invoice, :packing-list
   
   Returns:
     Map with parsed data or error"
  [text document-type]
  (case (keyword document-type)
    :bill-of-lading (parse-bill-of-lading text)
    :commercial-invoice (parse-commercial-invoice text)
    :packing-list (parse-packing-list text)
    {:error "Unknown document type"}))

(defn calculate-confidence-score
  "Calculate confidence score based on how many fields were extracted
   
   Args:
     parsed-data - Map with parsed fields
   
   Returns:
     Confidence score between 0.0 and 1.0"
  [parsed-data]
  (let [non-nil-fields (count (filter (comp not nil? val) parsed-data))
        total-fields (count parsed-data)
        score (if (> total-fields 0)
                (/ non-nil-fields total-fields)
                0.0)]
    (double score)))
