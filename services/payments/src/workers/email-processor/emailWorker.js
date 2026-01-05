import { gmailService } from './emailService.js';
import { parsePaymentEmails } from './emailParser.js';
import { addTransaction } from '../../services/transactions.service.js';
import { getTransactionByTransactionRef } from '../../api/repositories/transactions.repo.js';

/**
 * Process a single transaction
 * @param {object} transaction - Parsed transaction details
 * @returns {Promise<object>} Result of processing
 */
async function processTransaction(transaction) {
  try {
    // Check if transaction already exists
    const existing = await getTransactionByTransactionRef(transaction.transactionRef);
    
    if (existing) {
      console.log(`⏭️  Transaction ${transaction.transactionRef} already exists, skipping`);
      return {
        success: true,
        skipped: true,
        transactionRef: transaction.transactionRef,
        reason: 'already_exists',
      };
    }

    // Add new transaction
    const result = await addTransaction({
      transactionRef: transaction.transactionRef,
      amountCents: transaction.amountCents,
      dateTime: transaction.dateTime,
      sender: transaction.sender,
      receiver: transaction.receiver,
    });

    console.log(`✅ Successfully added transaction ${transaction.transactionRef}`);
    return {
      success: true,
      skipped: false,
      transactionRef: transaction.transactionRef,
      result,
    };
  } catch (error) {
    console.error(`❌ Error processing transaction ${transaction.transactionRef}:`, error.message);
    return {
      success: false,
      transactionRef: transaction.transactionRef,
      error: error.message,
    };
  }
}

/**
 * Process all transactions from parsed emails
 * @param {Array} transactions - Array of parsed transaction details
 * @returns {Promise<object>} Processing summary
 */
async function processTransactions(transactions) {
  const results = {
    total: transactions.length,
    added: 0,
    skipped: 0,
    failed: 0,
    details: [],
  };

  for (const transaction of transactions) {
    const result = await processTransaction(transaction);
    results.details.push(result);

    if (result.success) {
      if (result.skipped) {
        results.skipped++;
      } else {
        results.added++;
      }
    } else {
      results.failed++;
    }
  }

  return results;
}

/**
 * Main worker function - checks for new payment emails and processes them
 */
export async function runEmailWorker() {
  console.log('\n🔄 Starting email worker run at', new Date().toISOString());

  try {
    // Fetch unread payment emails
    const emails = await gmailService.fetchUnreadPaymentEmails();

    if (emails.length === 0) {
      console.log('✅ No new payment emails to process');
      return {
        success: true,
        emailsFound: 0,
        transactionsParsed: 0,
        transactionsAdded: 0,
      };
    }

    // Parse emails to extract transaction details
    const transactions = parsePaymentEmails(emails);

    if (transactions.length === 0) {
      console.log('⚠️  Found emails but could not parse any transactions');
      // Mark all emails as read anyway to avoid reprocessing
      for (const email of emails) {
        await gmailService.markAsRead(email.id);
      }
      return {
        success: true,
        emailsFound: emails.length,
        transactionsParsed: 0,
        transactionsAdded: 0,
      };
    }

    // Process all transactions
    const results = await processTransactions(transactions);

    // Mark emails as read after processing
    console.log(`📝 Marking ${emails.length} emails as read...`);
    for (const email of emails) {
      await gmailService.markAsRead(email.id);
    }

    // Log summary
    console.log('\n📊 Email Worker Summary:');
    console.log(`   Emails found: ${emails.length}`);
    console.log(`   Transactions parsed: ${transactions.length}`);
    console.log(`   Transactions added: ${results.added}`);
    console.log(`   Transactions skipped: ${results.skipped}`);
    console.log(`   Transactions failed: ${results.failed}`);

    return {
      success: true,
      emailsFound: emails.length,
      transactionsParsed: transactions.length,
      transactionsAdded: results.added,
      transactionsSkipped: results.skipped,
      transactionsFailed: results.failed,
      details: results.details,
    };
  } catch (error) {
    console.error('❌ Email worker error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Start the email worker with interval
 * Runs every minute by default
 */
export function startEmailWorker(intervalMs = 60000) {
  console.log(`🚀 Starting email worker (interval: ${intervalMs}ms = ${intervalMs / 1000}s)`);

  // Run immediately on start
  runEmailWorker();

  // Then run on interval
  const intervalId = setInterval(() => {
    runEmailWorker();
  }, intervalMs);

  // Return function to stop the worker
  return () => {
    console.log('⏹️  Stopping email worker');
    clearInterval(intervalId);
  };
}
