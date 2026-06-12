const cron = require('node-cron');
const { CashSession, SalesTransaction, sequelize } = require('../models');

// Run every day at midnight: '0 0 * * *'
const initShiftAutoClose = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Running midnight shift auto-close job...');
    
    try {
      // Find all open cash sessions
      const openSessions = await CashSession.findAll({
        where: {
          status: 'open'
        }
      });

      if (openSessions.length === 0) {
        console.log('[CRON] No open shifts found. Skipping.');
        return;
      }

      console.log(`[CRON] Found ${openSessions.length} open shift(s) to force close.`);

      for (const session of openSessions) {
        const t = await sequelize.transaction();
        
        try {
          // Calculate expected cash
          const transactions = await SalesTransaction.findAll({
            where: {
              cash_session_id: session.id,
              status: 'completed'
            },
            transaction: t
          });

          const cashSales = transactions
            .filter(tx => tx.payment_method === 'cash')
            .reduce((sum, tx) => sum + parseFloat(tx.total_amount), 0);
            
          const expectedCash = parseFloat(session.opening_balance) + cashSales;

          await session.update({
            expected_cash: expectedCash,
            actual_cash: null, // Actual cash wasn't physically counted
            difference: null,  // Cannot calculate difference without actual cash
            status: 'force_closed',
            ended_at: new Date(),
            notes: 'Auto-closed by system at midnight'
          }, { transaction: t });

          await t.commit();
          console.log(`[CRON] Force closed session ID ${session.id} for cashier ${session.cashier_id}`);
        } catch (err) {
          await t.rollback();
          console.error(`[CRON] Error closing session ID ${session.id}:`, err);
        }
      }
      
      console.log('[CRON] Midnight shift auto-close job completed successfully.');
    } catch (error) {
      console.error('[CRON] Fatal error in shift auto-close job:', error);
    }
  });
};

module.exports = initShiftAutoClose;
