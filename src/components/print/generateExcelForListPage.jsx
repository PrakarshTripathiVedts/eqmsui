import * as XLSX from "xlsx-js-style";

export const generateExcelForListPage = ({
    title,
    columns,
    data,
    fileName = "report",
    details = {}
}) => {

    // --------------------------------
    // REMOVE EXCLUDED COLUMNS
    // --------------------------------

    const excelColumns = columns.filter(
        (column) => !column.excelExclude
    );

    // --------------------------------
    // DETAILS
    // --------------------------------

    const detailRows = Object.entries(details).map(
        ([label, value]) => [
            label,
            value ?? "-"
        ]
    );

    // --------------------------------
    // TABLE HEADER
    // --------------------------------

    const headers = excelColumns.map(
        (column) => column.name
    );

    // --------------------------------
    // TABLE DATA
    // --------------------------------

    const dataRows = data.map((row) =>
        excelColumns.map((column) => {

            let value = "";

            // Get value from selector
            if (typeof column.selector === "function") {
                value = column.selector(row);
            }

            // Excel-specific formatter
            if (typeof column.excelFormatter === "function") {
                value = column.excelFormatter(value, row);
            }

            return value ?? "-";
        })
    );

    // --------------------------------
    // COMPLETE SHEET DATA
    // --------------------------------

    const sheetData = [
        [title],
        [],

        ...detailRows,

        [],

        headers,
        ...dataRows
    ];

    // --------------------------------
    // CREATE WORKSHEET
    // --------------------------------

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    // --------------------------------
    // HEADER ROW INDEX
    // --------------------------------

    // 0     = Title
    // 1     = Empty row
    // 2...  = Details
    // next  = Empty row
    // next  = Table headers

    const headerRowIndex = detailRows.length + 3;

    // --------------------------------
    // MERGE TITLE
    // --------------------------------

    worksheet["!merges"] = [
        {
            s: {
                r: 0,
                c: 0
            },
            e: {
                r: 0,
                c: Math.max(excelColumns.length - 1, 0)
            }
        }
    ];

    // --------------------------------
    // TITLE STYLE
    // --------------------------------

    const titleCell = worksheet["A1"];

    if (titleCell) {
        titleCell.s = {
            font: {
                bold: true,
                sz: 16
            },
            alignment: {
                horizontal: "center",
                vertical: "center"
            }
        };
    }

    // --------------------------------
    // HEADER STYLE
    // --------------------------------

    excelColumns.forEach((_, colIndex) => {

        const cellAddress = XLSX.utils.encode_cell({
            r: headerRowIndex,
            c: colIndex
        });

        const cell = worksheet[cellAddress];

        if (cell) {
            cell.s = {
                font: {
                    bold: true
                },
                alignment: {
                    horizontal: "center",
                    vertical: "center",
                    wrapText: true
                },
                border: {
                    top: {
                        style: "thin"
                    },
                    bottom: {
                        style: "thin"
                    },
                    left: {
                        style: "thin"
                    },
                    right: {
                        style: "thin"
                    }
                }
            };
        }
    });

    // --------------------------------
    // HEADER ROW HEIGHT
    // --------------------------------

    worksheet["!rows"] = [];

    worksheet["!rows"][headerRowIndex] = {
        hpt: 25
    };

    // --------------------------------
    // COLUMN WIDTHS
    // --------------------------------

    worksheet["!cols"] = excelColumns.map(
        (column) => ({
            wch: Math.max(
                column.name?.length || 10,
                15
            )
        })
    );

    // --------------------------------
    // CREATE WORKBOOK
    // --------------------------------

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Report"
    );

    // --------------------------------
    // DOWNLOAD
    // --------------------------------

    XLSX.writeFile(
        workbook,
        `${fileName}.xlsx`
    );
};