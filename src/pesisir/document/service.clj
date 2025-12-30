(ns pesisir.document.service
  "Document processing service - orchestrates the full workflow
   
   Workflow: Upload → Extract → Parse → Generate → Download"
  (:require [pesisir.document.model :as model]
            [pesisir.document.db :as doc-db]
            [pesisir.document.pdf-parser :as pdf]
            [pesisir.document.data-parser :as parser]
            [pesisir.document.excel-generator :as excel]
            [taoensso.timbre :as log]
            [clojure.java.io :as io])
  (:import [java.io File]
           [java.nio.file Files Paths]
           [java.util UUID]))

;; ============================================================================
;; File Management
;; ============================================================================

(def upload-dir "uploads")
(def output-dir "outputs")

(defn ensure-directories!
  "Ensure upload and output directories exist"
  []
  (doseq [dir [upload-dir output-dir]]
    (let [path (io/file dir)]
      (when-not (.exists path)
        (.mkdirs path)
        (log/info "Created directory" {:dir dir})))))

(defn generate-filename
  "Generate unique filename for uploaded file"
  [user-id original-filename]
  (let [uuid (str (UUID/randomUUID))
        ext (last (clojure.string/split original-filename #"\."))
        filename (str user-id "_" uuid "." ext)]
    filename))

(defn save-uploaded-file!
  "Save uploaded file to disk
   
   Args:
     file-data - File input stream or bytes
     filename - Generated filename
   
   Returns:
     {:success true :path \"...\"} or {:success false :error \"...\"}"
  [file-data filename]
  (try
    (ensure-directories!)
    (let [target-path (str upload-dir "/" filename)
          target-file (io/file target-path)]
      (io/copy file-data target-file)
      (log/info "File saved" {:path target-path :size (.length target-file)})
      {:success true :path target-path})
    (catch Exception e
      (log/error "Failed to save file" {:filename filename :error (.getMessage e)})
      {:success false :error (.getMessage e)})))

;; ============================================================================
;; Document Upload
;; ============================================================================

(defn upload-document!
  "Handle document upload
   
   Args:
     user-id - User ID
     file-data - File input stream or bytes
     original-filename - Original filename
     document-type - Document type keyword
   
   Returns:
     {:success true :document {...}} or {:success false :error \"...\"}"
  [user-id file-data original-filename document-type]
  (try
    ;; Validate document type
    (when-not (model/valid-document-type? document-type)
      (throw (ex-info "Invalid document type" {:type document-type})))
    
    ;; Generate filename and save file
    (let [filename (generate-filename user-id original-filename)
          save-result (save-uploaded-file! file-data filename)]
      
      (if (:success save-result)
        (let [file (io/file (:path save-result))
              file-size (.length file)
              
              ;; Create document record
              doc-data (model/create-document
                        {:user-id user-id
                         :filename original-filename
                         :file-path (:path save-result)
                         :file-size file-size
                         :document-type document-type})
              
              ;; Save to database
              created-doc (doc-db/create-document! doc-data)]
          
          (if created-doc
            (do
              (log/info "Document uploaded successfully" {:id (:id created-doc)})
              {:success true :document created-doc})
            {:success false :error "Failed to save document to database"}))
        
        {:success false :error (:error save-result)}))
    
    (catch Exception e
      (log/error "Document upload failed" {:error (.getMessage e)})
      {:success false :error (.getMessage e)})))

;; ============================================================================
;; Document Processing
;; ============================================================================

(defn process-document!
  "Process document: extract text and parse data
   
   Args:
     doc-id - Document ID
   
   Returns:
     {:success true :data {...}} or {:success false :error \"...\"}"
  [doc-id]
  (try
    (let [doc (doc-db/get-document-by-id doc-id)]
      (if-not doc
        {:success false :error "Document not found"}
        
        (do
          ;; Update status to extracting
          (doc-db/update-document-status! doc-id :extracting)
          
          ;; Extract PDF text
          (let [extract-result (pdf/extract-text-from-pdf (:file_path doc))]
            (if-not (:success extract-result)
              (do
                (doc-db/update-document-status! doc-id :failed (:error extract-result))
                {:success false :error (:error extract-result)})
              
              (do
                ;; Update status to parsing
                (doc-db/update-document-status! doc-id :parsing)
                
                ;; Parse extracted text
                (let [parsed-data (parser/parse-document 
                                   (:text extract-result)
                                   (:document_type doc))
                      confidence (parser/calculate-confidence-score parsed-data)]
                  
                  ;; Save extracted data
                  (doc-db/save-extracted-data! 
                   doc-id 
                   (:text extract-result)
                   parsed-data
                   confidence)
                  
                  (log/info "Document processed successfully" 
                           {:id doc-id :confidence confidence})
                  {:success true 
                   :data parsed-data
                   :confidence confidence})))))))
    
    (catch Exception e
      (log/error "Document processing failed" {:id doc-id :error (.getMessage e)})
      (doc-db/update-document-status! doc-id :failed (.getMessage e))
      {:success false :error (.getMessage e)})))

;; ============================================================================
;; Excel Generation
;; ============================================================================

(defn generate-excel-document!
  "Generate customs declaration Excel document
   
   Args:
     doc-id - Document ID
     customs-type - Customs document type (:bc-1-1, :bc-2-3, :bc-3-0)
   
   Returns:
     {:success true :file-path \"...\"} or {:success false :error \"...\"}"
  [doc-id customs-type]
  (try
    ;; Validate customs type
    (when-not (model/valid-customs-type? customs-type)
      (throw (ex-info "Invalid customs document type" {:type customs-type})))
    
    (let [doc (doc-db/get-document-by-id doc-id)]
      (if-not doc
        {:success false :error "Document not found"}
        
        (if-not (:extracted_data doc)
          {:success false :error "Document not processed yet"}
          
          (do
            ;; Update status to generating
            (doc-db/update-document-status! doc-id :generating)
            
            ;; Parse extracted data
            (let [data (cheshire.core/parse-string (:extracted_data doc) true)
                  parsed-data (:parsed data)
                  
                  ;; Generate output filename
                  output-filename (str "customs_" (name customs-type) "_" 
                                      doc-id "_" (System/currentTimeMillis) ".xlsx")
                  output-path (str output-dir "/" output-filename)
                  
                  ;; Generate Excel
                  result (excel/generate-customs-document 
                          customs-type 
                          parsed-data
                          output-path)]
              
              (if (:success result)
                (do
                  (doc-db/update-document-status! doc-id :completed)
                  (log/info "Excel generated successfully" {:id doc-id :path output-path})
                  {:success true :file-path output-path})
                
                (do
                  (doc-db/update-document-status! doc-id :failed (:error result))
                  {:success false :error (:error result)})))))))
    
    (catch Exception e
      (log/error "Excel generation failed" {:id doc-id :error (.getMessage e)})
      (doc-db/update-document-status! doc-id :failed (.getMessage e))
      {:success false :error (.getMessage e)}))))

;; ============================================================================
;; Complete Workflow
;; ============================================================================

(defn process-and-generate!
  "Complete workflow: upload → extract → parse → generate
   
   Args:
     user-id - User ID
     file-data - File input stream
     original-filename - Original filename
     document-type - Document type (:bill-of-lading, :commercial-invoice, etc.)
     customs-type - Customs document to generate (:bc-1-1, :bc-2-3, :bc-3-0)
   
   Returns:
     {:success true :document {...} :excel-path \"...\"} or error"
  [user-id file-data original-filename document-type customs-type]
  (try
    ;; Step 1: Upload
    (let [upload-result (upload-document! user-id file-data original-filename document-type)]
      (if-not (:success upload-result)
        upload-result
        
        ;; Step 2: Process (extract & parse)
        (let [doc-id (:id (:document upload-result))
              process-result (process-document! doc-id)]
          
          (if-not (:success process-result)
            (assoc upload-result :processing-error (:error process-result))
            
            ;; Step 3: Generate Excel
            (let [generate-result (generate-excel-document! doc-id customs-type)]
              (if (:success generate-result)
                {:success true
                 :document (:document upload-result)
                 :parsed-data (:data process-result)
                 :confidence (:confidence process-result)
                 :excel-path (:file-path generate-result)}
                
                (assoc upload-result 
                       :processing-result process-result
                       :generation-error (:error generate-result))))))))
    
    (catch Exception e
      (log/error "Complete workflow failed" {:error (.getMessage e)})
      {:success false :error (.getMessage e)}))))
