(ns pesisir.document.excel-generator
  "Excel document generation using Apache POI
   
   Generates customs declaration forms (BC 1.1, BC 2.3, BC 3.0) in Excel format"
  (:require [taoensso.timbre :as log])
  (:import [org.apache.poi.xssf.usermodel XSSFWorkbook]
           [org.apache.poi.ss.usermodel Sheet Row Cell CellStyle Font IndexedColors]
           [java.io FileOutputStream]
           [java.time LocalDateTime]
           [java.time.format DateTimeFormatter]))

;; ============================================================================
;; Utility Functions
;; ============================================================================

(defn create-workbook
  "Create a new Excel workbook"
  []
  (XSSFWorkbook.))

(defn create-sheet
  "Create a new sheet in workbook"
  [^XSSFWorkbook workbook sheet-name]
  (.createSheet workbook sheet-name))

(defn create-row
  "Create a new row in sheet"
  [^Sheet sheet row-num]
  (.createRow sheet row-num))

(defn create-cell
  "Create a cell and set its value"
  [^Row row col-num value]
  (let [cell (.createCell row col-num)]
    (when value
      (cond
        (string? value) (.setCellValue cell ^String value)
        (number? value) (.setCellValue cell (double value))
        :else (.setCellValue cell (str value))))
    cell))

(defn create-header-style
  "Create a bold header style"
  [^XSSFWorkbook workbook]
  (let [style (.createCellStyle workbook)
        font (.createFont workbook)]
    (.setBold font true)
    (.setFontHeightInPoints font 12)
    (.setFont style font)
    (.setFillForegroundColor style IndexedColors/GREY_25_PERCENT)
    style))

;; ============================================================================
;; BC 1.1 Generator (Manifest)
;; ============================================================================

(defn generate-bc-1-1
  "Generate BC 1.1 (Manifest) Excel document
   
   Args:
     data - Map containing BOL data
     output-path - Path to save the Excel file
   
   Returns:
     {:success true :file output-path} or {:success false :error \"...\"}"
  [data output-path]
  (try
    (let [workbook (create-workbook)
          sheet (create-sheet workbook "BC 1.1 - Manifest")
          header-style (create-header-style workbook)]
      
      ;; Header Section
      (let [row0 (create-row sheet 0)]
        (create-cell row0 0 "BC 1.1 - MANIFEST")
        (.setHeight row0 (short 600)))
      
      (let [row1 (create-row sheet 1)]
        (create-cell row1 0 ""))
      
      ;; Vessel Information
      (let [row2 (create-row sheet 2)]
        (create-cell row2 0 "Nama Sarana Pengangkut")
        (create-cell row2 1 (:vessel-name data)))
      
      (let [row3 (create-row sheet 3)]
        (create-cell row3 0 "Nomor Voyage")
        (create-cell row3 1 (:voyage-number data)))
      
      (let [row4 (create-row sheet 4)]
        (create-cell row4 0 "Pelabuhan Muat")
        (create-cell row4 1 (:port-of-loading data)))
      
      (let [row5 (create-row sheet 5)]
        (create-cell row5 0 "Pelabuhan Bongkar")
        (create-cell row5 1 (:port-of-discharge data)))
      
      (let [row6 (create-row sheet 6)]
        (create-cell row6 0 "Tanggal Keberangkatan")
        (create-cell row6 1 (:date-of-issue data)))
      
      ;; Container Information
      (let [row7 (create-row sheet 7)]
        (create-cell row7 0 ""))
      
      (let [row8 (create-row sheet 8)
            header-cell0 (create-cell row8 0 "No")
            header-cell1 (create-cell row8 1 "Nomor Kontainer")
            header-cell2 (create-cell row8 2 "Ukuran")
            header-cell3 (create-cell row8 3 "Jenis")]
        (.setCellStyle header-cell0 header-style)
        (.setCellStyle header-cell1 header-style)
        (.setCellStyle header-cell2 header-style)
        (.setCellStyle header-cell3 header-style))
      
      ;; Container Data
      (doseq [[idx container] (map-indexed vector (:container-numbers data []))]
        (let [row (create-row sheet (+ 9 idx))]
          (create-cell row 0 (str (inc idx)))
          (create-cell row 1 container)
          (create-cell row 2 "20")
          (create-cell row 3 "GP")))
      
      ;; Auto-size columns
      (doseq [col (range 4)]
        (.autoSizeColumn sheet col))
      
      ;; Save workbook
      (with-open [file-out (FileOutputStream. output-path)]
        (.write workbook file-out))
      
      (.close workbook)
      
      (log/info "BC 1.1 generated successfully" {:output output-path})
      {:success true :file output-path})
    
    (catch Exception e
      (log/error "BC 1.1 generation failed" {:error (.getMessage e)})
      {:success false :error (.getMessage e)})))

;; ============================================================================
;; BC 2.3 Generator (Import Declaration)
;; ============================================================================

(defn generate-bc-2-3
  "Generate BC 2.3 (Import Declaration for Temporary Storage) Excel document
   
   Args:
     data - Map containing CI and BOL data
     output-path - Path to save the Excel file
   
   Returns:
     {:success true :file output-path} or {:success false :error \"...\"}"
  [data output-path]
  (try
    (let [workbook (create-workbook)
          sheet (create-sheet workbook "BC 2.3")
          header-style (create-header-style workbook)]
      
      ;; Header
      (let [row0 (create-row sheet 0)]
        (create-cell row0 0 "BC 2.3 - PEMBERITAHUAN IMPOR BARANG UNTUK DITIMBUN"))
      
      ;; Importer Information
      (let [row2 (create-row sheet 2)]
        (create-cell row2 0 "Importir")
        (create-cell row2 1 (:buyer data)))
      
      (let [row3 (create-row sheet 3)]
        (create-cell row3 0 "Pemasok (Supplier)")
        (create-cell row3 1 (:seller data)))
      
      ;; Invoice Information
      (let [row4 (create-row sheet 4)]
        (create-cell row4 0 "Nomor Invoice")
        (create-cell row4 1 (:invoice-number data)))
      
      (let [row5 (create-row sheet 5)]
        (create-cell row5 0 "Tanggal Invoice")
        (create-cell row5 1 (:invoice-date data)))
      
      (let [row6 (create-row sheet 6)]
        (create-cell row6 0 "Nilai FOB")
        (create-cell row6 1 (:total-amount data)))
      
      (let [row7 (create-row sheet 7)]
        (create-cell row7 0 "Mata Uang")
        (create-cell row7 1 (:currency data "USD")))
      
      ;; Transport Information
      (let [row9 (create-row sheet 9)]
        (create-cell row9 0 "Nama Sarana Pengangkut")
        (create-cell row9 1 (:vessel-name data)))
      
      (let [row10 (create-row sheet 10)]
        (create-cell row10 0 "Nomor BL/AWB")
        (create-cell row10 1 (:bl-number data)))
      
      ;; Auto-size columns
      (doseq [col (range 3)]
        (.autoSizeColumn sheet col))
      
      ;; Save workbook
      (with-open [file-out (FileOutputStream. output-path)]
        (.write workbook file-out))
      
      (.close workbook)
      
      (log/info "BC 2.3 generated successfully" {:output output-path})
      {:success true :file output-path})
    
    (catch Exception e
      (log/error "BC 2.3 generation failed" {:error (.getMessage e)})
      {:success false :error (.getMessage e)})))

;; ============================================================================
;; BC 3.0 Generator (Transit/Transshipment)
;; ============================================================================

(defn generate-bc-3-0
  "Generate BC 3.0 (Transit/Transshipment Declaration) Excel document
   
   Args:
     data - Map containing BOL data
     output-path - Path to save the Excel file
   
   Returns:
     {:success true :file output-path} or {:success false :error \"...\"}"
  [data output-path]
  (try
    (let [workbook (create-workbook)
          sheet (create-sheet workbook "BC 3.0")
          header-style (create-header-style workbook)]
      
      ;; Header
      (let [row0 (create-row sheet 0)]
        (create-cell row0 0 "BC 3.0 - PEMBERITAHUAN UNTUK DIANGKUT TERUS/DIANGKUT LANJUT"))
      
      ;; Document Information
      (let [row2 (create-row sheet 2)]
        (create-cell row2 0 "Nomor BL")
        (create-cell row2 1 (:bl-number data)))
      
      (let [row3 (create-row sheet 3)]
        (create-cell row3 0 "Nama Sarana Pengangkut Masuk")
        (create-cell row3 1 (:vessel-name data)))
      
      (let [row4 (create-row sheet 4)]
        (create-cell row4 0 "Pelabuhan Muat")
        (create-cell row4 1 (:port-of-loading data)))
      
      (let [row5 (create-row sheet 5)]
        (create-cell row5 0 "Pelabuhan Transit")
        (create-cell row5 1 (:port-of-discharge data)))
      
      (let [row6 (create-row sheet 6)]
        (create-cell row6 0 "Pelabuhan Tujuan Akhir")
        (create-cell row6 1 ""))
      
      ;; Container Information
      (let [row8 (create-row sheet 8)
            header-cell0 (create-cell row8 0 "No")
            header-cell1 (create-cell row8 1 "Nomor Kontainer")]
        (.setCellStyle header-cell0 header-style)
        (.setCellStyle header-cell1 header-style))
      
      ;; Container Data
      (doseq [[idx container] (map-indexed vector (:container-numbers data []))]
        (let [row (create-row sheet (+ 9 idx))]
          (create-cell row 0 (str (inc idx)))
          (create-cell row 1 container)))
      
      ;; Auto-size columns
      (doseq [col (range 3)]
        (.autoSizeColumn sheet col))
      
      ;; Save workbook
      (with-open [file-out (FileOutputStream. output-path)]
        (.write workbook file-out))
      
      (.close workbook)
      
      (log/info "BC 3.0 generated successfully" {:output output-path})
      {:success true :file output-path})
    
    (catch Exception e
      (log/error "BC 3.0 generation failed" {:error (.getMessage e)})
      {:success false :error (.getMessage e)})))

;; ============================================================================
;; Main Generator Function
;; ============================================================================

(defn generate-customs-document
  "Generate customs document based on type
   
   Args:
     customs-type - One of :bc-1-1, :bc-2-3, :bc-3-0
     data - Parsed document data
     output-path - Path to save the Excel file
   
   Returns:
     {:success true :file output-path} or {:success false :error \"...\"}"
  [customs-type data output-path]
  (case (keyword customs-type)
    :bc-1-1 (generate-bc-1-1 data output-path)
    :bc-2-3 (generate-bc-2-3 data output-path)
    :bc-3-0 (generate-bc-3-0 data output-path)
    {:success false :error "Unknown customs document type"}))
