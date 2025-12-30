(ns pesisir.document.pdf-parser
  "PDF parsing service using Apache PDFBox"
  (:require [taoensso.timbre :as log])
  (:import [org.apache.pdfbox.pdmodel PDDocument]
           [org.apache.pdfbox.text PDFTextStripper]
           [java.io File]))

(defn extract-text-from-pdf
  "Extract text content from a PDF file
   
   Args:
     file-path - Path to the PDF file
   
   Returns:
     {:success true :text \"extracted text\"}
     or
     {:success false :error \"error message\"}"
  [file-path]
  (try
    (with-open [document (PDDocument/load (File. file-path))]
      (let [stripper (PDFTextStripper.)
            text (.getText stripper document)
            page-count (.getNumberOfPages document)]
        (log/info "PDF extraction successful" 
                  {:file file-path 
                   :pages page-count 
                   :text-length (count text)})
        {:success true
         :text text
         :page-count page-count
         :text-length (count text)}))
    (catch Exception e
      (log/error "PDF extraction failed" 
                 {:file file-path 
                  :error (.getMessage e)})
      {:success false
       :error (.getMessage e)})))

(defn validate-pdf
  "Check if a file is a valid PDF
   
   Args:
     file-path - Path to the PDF file
   
   Returns:
     {:valid true} or {:valid false :error \"...\"}"
  [file-path]
  (try
    (with-open [document (PDDocument/load (File. file-path))]
      (if (> (.getNumberOfPages document) 0)
        {:valid true}
        {:valid false :error "PDF has no pages"}))
    (catch Exception e
      {:valid false 
       :error (.getMessage e)})))

(defn extract-metadata
  "Extract PDF metadata
   
   Args:
     file-path - Path to the PDF file
   
   Returns:
     Map with metadata fields"
  [file-path]
  (try
    (with-open [document (PDDocument/load (File. file-path))]
      (let [info (.getDocumentInformation document)]
        {:title (.getTitle info)
         :author (.getAuthor info)
         :subject (.getSubject info)
         :keywords (.getKeywords info)
         :creator (.getCreator info)
         :producer (.getProducer info)
         :creation-date (str (.getCreationDate info))
         :modification-date (str (.getModificationDate info))
         :page-count (.getNumberOfPages document)}))
    (catch Exception e
      (log/error "Failed to extract metadata" {:error (.getMessage e)})
      {})))
