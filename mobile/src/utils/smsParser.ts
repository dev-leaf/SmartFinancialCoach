export interface ParsedSmsExpense {
  amount: number;
  merchant: string;
  category: string;
  timestamp: string;
  smsId: string;
}

export interface SmsMessage {
  _id: string;
  address: string;
  body: string;
  date: string;
}

// Basic regex for Indian standard banking SMS
const amountRegex = /(?:Rs\.?|INR|\$)\s*([\d,]+\.?\d*)/i;
const debitKeywords = /(debited|spent|paid|purchased|deducted|sent)/i;
// Match after "at", "on", "to" up to the next preposition or end of sentence
const merchantRegex = /(?:at|on|to)\s+([A-Za-z0-9\s]+?)(?=\s(?:using|from|via|available|balance|bal)|\.|$)/i;

const determineCategory = (merchant: string): string => {
  const m = merchant.toLowerCase();
  
  if (m.includes('zomato') || m.includes('swiggy') || m.includes('kfc') || m.includes('mcdonalds') || m.includes('dominos') || m.includes('food')) {
    return 'Food';
  }
  if (m.includes('uber') || m.includes('ola') || m.includes('rapido') || m.includes('irctc') || m.includes('makemytrip')) {
    return 'Transport';
  }
  if (m.includes('amazon') || m.includes('flipkart') || m.includes('myntra') || m.includes('ajio')) {
    return 'Shopping';
  }
  if (m.includes('netflix') || m.includes('spotify') || m.includes('prime')) {
    return 'Entertainment';
  }
  if (m.includes('apollo') || m.includes('pharm') || m.includes('hospital')) {
    return 'Health';
  }
  if (m.includes('airtel') || m.includes('jio') || m.includes('bescom') || m.includes('electricity')) {
    return 'Utilities';
  }
  
  return 'Other'; // Default
};

export const parseSmsForExpense = (sms: SmsMessage): ParsedSmsExpense | null => {
  const body = sms.body;

  // 1. Is it a debit transaction?
  if (!debitKeywords.test(body)) {
    return null; // Not a debit
  }

  // 2. Extract Amount
  const amountMatch = body.match(amountRegex);
  if (!amountMatch || !amountMatch[1]) {
    return null; // Couldn't find amount
  }
  
  // Clean commas and parse
  const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  if (isNaN(amount) || amount <= 0) return null;

  // 3. Extract Merchant
  let merchant = 'Unknown Merchant';
  const merchantMatch = body.match(merchantRegex);
  if (merchantMatch && merchantMatch[1]) {
    // Clean up whitespace and restrict length just in case regex ran too far
    merchant = merchantMatch[1].trim().substring(0, 30);
  }

  // 4. Auto-Categorize
  const category = determineCategory(merchant);

  return {
    amount,
    merchant,
    category,
    // Convert MS epoch to ISO string
    timestamp: new Date(parseInt(sms.date)).toISOString(),
    smsId: sms._id
  };
};
