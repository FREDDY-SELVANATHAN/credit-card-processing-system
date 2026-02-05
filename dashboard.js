// ============ DASHBOARD FUNCTIONALITY ============

/**
 * Update admin dashboard with statistics
 */
async function updateAdminDashboard() {
    // Load fresh data from database
    await loadAdminData();
    
    const stats = {
        total: state.transactions.length,
        success: state.transactions.filter(t => t.status === 'success').length,
        failed: state.transactions.filter(t => t.status === 'failed').length,
        pending: state.transactions.filter(t => t.status === 'pending').length
    };

    document.getElementById('totalTransCount').textContent = stats.total.toLocaleString();
    document.getElementById('successTransCount').textContent = stats.success.toLocaleString();
    document.getElementById('failedTransCount').textContent = stats.failed.toLocaleString();
    document.getElementById('pendingTransCount').textContent = stats.pending.toLocaleString();
    
    // Update tables
    updateCardTable();
    updateFailedLogsTable();
}
