// Used in OrderSummary.vue to convert date/time from SG time to UTC, send to backend 
export function convertToUtcISOString(dateStr, timeStr) {
  const [time, modifier] = timeStr.split(' ')
  let [hours, minutes] = time.split(':')

  if (modifier === 'PM' && hours !== '12') {
    hours = String(parseInt(hours) + 12)
  } else if (modifier === 'AM' && hours === '12') {
    hours = '00'
  }
  hours = hours.padStart(2, '0')
  minutes = minutes.padStart(2, '0')
  const localDateTimeStr = `${dateStr}T${hours}:${minutes}:00`
  const localDate = new Date(localDateTimeStr)
  return localDate.toISOString()
}

// Used in active orders, past orders page and OrderReceipts.vue to display date/time from UTC to SG time 
export function formatDateTime(dateString) {
  const options = {
    timeZone: 'Asia/Singapore',  
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }
  return new Date(dateString).toLocaleString('en-SG', options)
}

// formats delivery location string nicely from building, room type, and room number in OrderReceipts, ActiveOrders and PastOrders pages
export function formatLocation(order) {
  let loc = ''
  if (order.building) loc += order.building.charAt(0).toUpperCase() + order.building.slice(1)
  if (order.room_type) loc += ', ' + order.room_type.charAt(0).toUpperCase() + order.room_type.slice(1)
  if (order.room_number) loc += ' ' + order.room_number
  return loc.trim()
}
// export function formatLocation(order) {
//   return `${order.building.toUpperCase()}, ${order.room_type} ${order.room_number}`
// }

export function formatStatusClass(status) {
  return {
    'refund_pending': 'status-grey',
    'refund_complete': 'status-grey',
    'awaiting_payment': 'status-grey',
    'awaiting_verification': 'status-grey',
    'payment_confirmed': 'status-orange',
    'preparing': 'status-yellow',
    'collected_by_runner': 'status-yellow',
    'delivered': 'status-green',
    'completed': 'status-green',
    'cancelled': 'status-red'
  }[status] || 'status-grey'
}

export function formatStatus(status) {
  switch (status) {
    case 'refund_pending': return 'Refund pending'
    case 'refund_complete': return 'Refund completed'
    case 'awaiting_payment': return 'Awaiting payment'
    case 'payment_confirmed': return 'Payment confirmed'
    case 'awaiting_verification': return 'Awaiting verification'
    case 'preparing': return 'Preparing'
    case 'collected_by_runner': return 'Collected by runner'
    case 'delivered': return 'Delivered'
    case 'completed': return 'Completed'
    case 'cancelled': return 'Cancelled'
    default: return status
  }
}