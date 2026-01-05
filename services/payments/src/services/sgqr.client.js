import axios from "axios";

const SGQR_API_URL = "https://www.sgqrcode.com/paynow";

/**
 * Generates a PayNow QR code by calling the SGQR API endpoint.
 *
 * Sends a GET request to the SGQR API (`SGQR_API_URL`) with the provided
 * payment parameters and returns an Axios response containing the QR code image data.
 *
 * The SGQR API returns the QR code as binary PNG data (use `responseType: 'arraybuffer'`).
 *
 * @async
 * @function generatePayNowQRCodeUsingSGQR
 * @param {Object} params - Parameters for generating the QR code.
 * @param {number|string} params.amount - Transaction amount in SGD (e.g., `7.90` or `'7.90'`).
 * @param {string} params.mobile - PayNow-registered mobile number linked to the recipient.
 * @param {string} [params.uen] - Recipient UEN (Unique Entity Number); leave empty if using mobile.
 * @param {0|1} [params.editable=0] - Whether the amount is editable by the payer (`0` = fixed, `1` = editable).
 * @param {string} [params.expiry] - Expiry datetime e.g. '2025/07/07 23:00'
 * @param {string} params.ref_id - Unique payment reference string (e.g., `SMUNCH123`).
 * @param {string} params.company - Display name of the merchant or company (e.g., `'SMUNCH'`).
 *
 * @returns {Promise<import('axios').AxiosResponse<ArrayBuffer>>}
 * A Promise resolving to the Axios response containing the raw PNG QR code image data.
 *
 * @throws {Error} If the HTTP request fails or returns a non-2xx response.
 *
 * @example
    const expiryStr = formatPaynowExpiry();
    const dataUrl = await generatePayNowQRCodeUsingSGQR({
    amount: '7.90',
    mobile: '87896972',
    uen: '',
    editable: 0,
    expiry: expiryStr,
    ref_id: 'SMUNCH123ABC',
    company: 'SMUNCH',
    });
 */
export async function generatePayNowQRCodeUsingSGQR({
  amount,
  mobile,
  uen,
  editable,
  expiry,
  ref_id,
  company,
}) {
  const response = await axios.get(SGQR_API_URL, {
    responseType: "arraybuffer",
    params: {
      mobile, //paynowNumber
      uen,
      editable, //0 for not editable, 1 for editable
      amount,
      expiry,
      ref_id,
      company,
    },
    headers: {
      Accept: "image/png,image/*,*/*;q=0.8",
      //uncomment below if need to mimic a better request header
      
      // browser Accept header
      // Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      // // Accept-Encoding: Node handles compression for you; you can send it explicitly
      // 'Accept-Encoding': 'gzip, deflate, br, zstd',
      // 'Accept-Language': 'en-GB,en;q=0.7',
      // Referer: 'https://fullstacksys.com/',
      // // Browser
      // 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
      // // Client
      // 'sec-ch-ua': '"Brave";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
      // 'sec-ch-ua-mobile': '?0',
      // 'sec-ch-ua-platform': '"Windows"',
      // // metadata headers
      // 'Sec-Fetch-Dest': 'image',
      // 'Sec-Fetch-Mode': 'no-cors',
      // 'Sec-Fetch-Site': 'cross-site',
      // 'Sec-Fetch-User': '?1',
      // // privacy header
      // 'Sec-GPC': '1',
    },
  });

  // check if returning a png image cos sometimes it return captcha html page
  if (!response.headers['content-type']?.includes('image/png')) {
    throw new Error(`Non-image response: ${response.headers['content-type']}`);
  }
  //convert image to base64 to send to frontend
  const base64Image = Buffer.from(response.data).toString("base64");
  const qrCodeDataURL = `data:image/png;base64,${base64Image}`;

  return qrCodeDataURL;
}

// import { formatPaynowExpiry } from "./payment.utils.js";
// const test = async () => {
//     const expiryStr = formatPaynowExpiry();
//     const dataUrl = await generatePayNowQRCodeUsingSGQR({
//     amount: '7.90',
//     mobile: '87896972',
//     uen: '',
//     editable: 0,
//     expiry: expiryStr,
//     ref_id: 'SMUNCH123ABC',
//     company: 'SMUNCH',
//     });
//     console.log(dataUrl);
// };

//test();