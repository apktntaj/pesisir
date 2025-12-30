(ns pesisir.document.model
  "Document domain models and validation")

;; Document Types
(def document-types
  "Supported document types for customs processing"
  #{:bill-of-lading    ; BOL - shipping document
    :commercial-invoice ; CI - invoice from seller
    :packing-list})     ; PL - details of goods packed

;; Document Status
(def document-statuses
  "Valid document processing statuses"
  #{:uploaded           ; Initial upload
    :extracting         ; PDF text extraction in progress
    :extracted          ; Text successfully extracted
    :parsing            ; Parsing structured data
    :parsed             ; Data successfully parsed
    :generating         ; Generating Excel output
    :completed          ; Process completed
    :failed})           ; Processing failed

;; Customs Document Types (Output)
(def customs-document-types
  "Types of customs documents that can be generated"
  #{:bc-1-1             ; Manifest
    :bc-2-3             ; Import Declaration for Temporary Storage
    :bc-3-0})           ; Transit/Transshipment Declaration

;; Document Model
(defn create-document
  "Create a new document record"
  [{:keys [user-id filename file-path file-size document-type]}]
  {:user-id user-id
   :original-filename filename
   :file-path file-path
   :file-size file-size
   :document-type (keyword document-type)
   :status :uploaded
   :extracted-text nil
   :parsed-data nil
   :confidence-score nil
   :processing-error nil
   :created-at (java.time.Instant/now)
   :updated-at (java.time.Instant/now)})

;; Validation
(defn valid-document-type?
  "Check if document type is valid"
  [doc-type]
  (contains? document-types (keyword doc-type)))

(defn valid-status?
  "Check if status is valid"
  [status]
  (contains? document-statuses (keyword status)))

(defn valid-customs-type?
  "Check if customs document type is valid"
  [customs-type]
  (contains? customs-document-types (keyword customs-type)))
