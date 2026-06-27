const getApiUrl = () => {
  const rawUrl = import.meta.env.VITE_API_URL || `${window.location.origin}/api`
  const trimmedUrl = rawUrl.replace(/\/+$/, '')
  return trimmedUrl.endsWith('/api') ? trimmedUrl : `${trimmedUrl}/api`
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}

export const sendPaymentReceivedNotification = async (
  studentName,
  parentEmail,
  parentPhone,
  amount,
  invoiceId,
  paymentMethod,
  transactionReference
) => {
  try {
    const response = await fetch(`${getApiUrl()}/admin/notifications/payment-received`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        studentName,
        parentEmail,
        parentPhone,
        amount,
        invoiceId,
        paymentMethod,
        transactionReference
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to send notification')
    }

    return await response.json()
  } catch (error) {
    console.error('sendPaymentReceivedNotification error:', error)
    throw error
  }
}

export const sendDueDateReminder = async () => {
  throw new Error('Due date reminder is not implemented in the API yet')
}

export const sendOverdueNotice = async () => {
  throw new Error('Overdue notice is not implemented in the API yet')
}

export const sendScheduledReport = async () => {
  throw new Error('Scheduled report is not implemented in the API yet')
}

export default {
  sendPaymentReceivedNotification,
  sendDueDateReminder,
  sendOverdueNotice,
  sendScheduledReport
}
