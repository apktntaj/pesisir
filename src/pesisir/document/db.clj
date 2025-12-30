(ns pesisir.document.db
  "Database operations for documents"
  (:require [pesisir.db :as db]
            [clojure.java.jdbc :as jdbc]
            [taoensso.timbre :as log]
            [cheshire.core :as json]))

(defn create-document!
  "Insert a new document record
   
   Args:
     document - Map with document fields
   
   Returns:
     Created document with ID"
  [document]
  (try
    (let [result (jdbc/insert! (db/get-db-spec)
                               :documents
                               {:user_id (:user-id document)
                                :original_filename (:original-filename document)
                                :file_path (:file-path document)
                                :file_size (:file-size document)
                                :document_type (name (:document-type document))
                                :status (name (:status document :uploaded))
                                :created_at (java.sql.Timestamp/from (:created-at document))
                                :updated_at (java.sql.Timestamp/from (:updated-at document))})]
      (log/info "Document created" {:id (:id (first result))})
      (first result))
    (catch Exception e
      (log/error "Failed to create document" {:error (.getMessage e)})
      nil)))

(defn get-document-by-id
  "Get document by ID
   
   Args:
     doc-id - Document ID
   
   Returns:
     Document map or nil"
  [doc-id]
  (try
    (first (jdbc/query (db/get-db-spec)
                       ["SELECT * FROM documents WHERE id = ?" doc-id]))
    (catch Exception e
      (log/error "Failed to get document" {:id doc-id :error (.getMessage e)})
      nil)))

(defn get-user-documents
  "Get all documents for a user
   
   Args:
     user-id - User ID
     options - Map with :limit, :offset for pagination
   
   Returns:
     Vector of documents"
  [user-id & [options]]
  (try
    (let [limit (or (:limit options) 50)
          offset (or (:offset options) 0)]
      (jdbc/query (db/get-db-spec)
                  ["SELECT * FROM documents WHERE user_id = ? AND deleted_at IS NULL 
                    ORDER BY created_at DESC LIMIT ? OFFSET ?" 
                   user-id limit offset]))
    (catch Exception e
      (log/error "Failed to get user documents" {:user-id user-id :error (.getMessage e)})
      [])))

(defn update-document-status!
  "Update document processing status
   
   Args:
     doc-id - Document ID
     status - New status keyword
     error-msg - Optional error message
   
   Returns:
     Updated count"
  [doc-id status & [error-msg]]
  (try
    (jdbc/update! (db/get-db-spec)
                  :documents
                  {:status (name status)
                   :processing_error error-msg
                   :updated_at (java.sql.Timestamp. (System/currentTimeMillis))}
                  ["id = ?" doc-id])
    (catch Exception e
      (log/error "Failed to update document status" 
                 {:id doc-id :status status :error (.getMessage e)})
      0)))

(defn save-extracted-data!
  "Save extracted and parsed data for document
   
   Args:
     doc-id - Document ID
     extracted-text - Raw extracted text
     parsed-data - Structured parsed data
     confidence-score - Confidence score (0.0 - 1.0)
   
   Returns:
     Updated count"
  [doc-id extracted-text parsed-data confidence-score]
  (try
    (jdbc/update! (db/get-db-spec)
                  :documents
                  {:status "parsed"
                   :extracted_data (json/generate-string 
                                    {:raw-text extracted-text
                                     :parsed parsed-data})
                   :confidence_score confidence-score
                   :updated_at (java.sql.Timestamp. (System/currentTimeMillis))}
                  ["id = ?" doc-id])
    (catch Exception e
      (log/error "Failed to save extracted data" 
                 {:id doc-id :error (.getMessage e)})
      0)))

(defn delete-document!
  "Soft delete a document
   
   Args:
     doc-id - Document ID
   
   Returns:
     Updated count"
  [doc-id]
  (try
    (jdbc/update! (db/get-db-spec)
                  :documents
                  {:deleted_at (java.sql.Timestamp. (System/currentTimeMillis))}
                  ["id = ?" doc-id])
    (catch Exception e
      (log/error "Failed to delete document" {:id doc-id :error (.getMessage e)})
      0)))

(defn count-user-documents
  "Count total documents for user
   
   Args:
     user-id - User ID
   
   Returns:
     Document count"
  [user-id]
  (try
    (let [result (jdbc/query (db/get-db-spec)
                             ["SELECT COUNT(*) as count FROM documents 
                               WHERE user_id = ? AND deleted_at IS NULL" 
                              user-id])]
      (:count (first result) 0))
    (catch Exception e
      (log/error "Failed to count documents" {:user-id user-id :error (.getMessage e)})
      0)))
