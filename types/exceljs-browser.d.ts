declare module "exceljs/dist/exceljs.min.js" {
  import ExcelJS from "exceljs";

  const browserExcelJS: typeof ExcelJS;
  export default browserExcelJS;
}
