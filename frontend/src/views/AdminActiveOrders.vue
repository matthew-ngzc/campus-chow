<template>
  <div class="wrap">
    <!-- Header -->
    <div class="header">
      <div class="accent"></div>
      <h1 class="title">Active Orders</h1>
      <p class="subtitle">Review payments that need attention</p>
    </div>

    <!-- Two columns -->
    <div class="grid">
      <!-- LEFT: Pending Payment -->
      <section class="card">
        <div class="card-head">
          <h3>Orders pending payment</h3>
          <div class="actions">
            <button class="btn ghost" :disabled="selPay.size===0 || busy"
                    @click="bulkVerify()">Mark verified</button>
            <span class="muted" v-if="selPay.size">selected: {{ selPay.size }}</span>
          </div>
        </div>

        <div v-if="loading" class="empty">Loading…</div>
        <div v-else-if="payRows.length===0" class="empty">No orders pending payment.</div>
        <div v-else class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th style="width:36px">
                  <input type="checkbox" :checked="allCheckedPay" @change="toggleAll('pay')"/>
                </th>
                <th style="width:80px">ID</th>
                <th>User</th>
                <th style="width:120px">Amount</th>
                <th style="width:160px">Created</th>
                <th style="width:160px">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="o in payRows" :key="o.id">
                <td>
                  <input type="checkbox" :checked="selPay.has(o.id)"
                         @change="toggleSel('pay', o.id)"/>
                </td>
                <td>#{{ o.id }}</td>
                <td>{{ o.userEmail }}</td>
                <td>${{ o.amount.toFixed(2) }}</td>
                <td>{{ fmt(o.createdAt) }}</td>
                <td>
                  <button class="btn ghost" @click="openDetails(o, 'pay')">View details</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- RIGHT: Pending Refund -->
      <section class="card">
        <div class="card-head">
          <h3>Orders pending refund</h3>
          <div class="actions">
            <button class="btn ghost" :disabled="selRefund.size===0 || busy"
                    @click="bulkRefund()">Mark refunded</button>
            <span class="muted" v-if="selRefund.size">selected: {{ selRefund.size }}</span>
          </div>
        </div>

        <div v-if="loading" class="empty">Loading…</div>
        <div v-else-if="refundRows.length===0" class="empty">No orders pending refund.</div>
        <div v-else class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th style="width:36px">
                  <input type="checkbox" :checked="allCheckedRefund" @change="toggleAll('refund')"/>
                </th>
                <th style="width:80px">ID</th>
                <th>User</th>
                <th style="width:120px">Amount</th>
                <th style="width:160px">Created</th>
                <th style="width:160px">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="o in refundRows" :key="o.id">
                <td>
                  <input type="checkbox" :checked="selRefund.has(o.id)"
                         @change="toggleSel('refund', o.id)"/>
                </td>
                <td>#{{ o.id }}</td>
                <td>{{ o.userEmail }}</td>
                <td>${{ o.amount.toFixed(2) }}</td>
                <td>{{ fmt(o.createdAt) }}</td>
                <td>
                  <button class="btn ghost" @click="openDetails(o, 'refund')">View details</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <!-- Toast -->
    <div v-if="toast" class="toast">{{ toast }}</div>

    <!-- Details dialog -->
    <dialog ref="dlg" class="umodal" @close="onDialogClosed">
      <div class="modal-header">
        <h3>Order Details</h3>
        <button class="icon-btn" @click="dlgClose">✕</button>
      </div>

      <div class="modal-body">
        <div class="grid2">
          <div>
            <label class="label">Order ID</label>
            <div class="static-box">#{{ form.id }}</div>
          </div>
          <div>
            <label class="label">User</label>
            <div class="static-box">{{ form.userEmail }}</div>
          </div>
          <div>
            <label class="label">Amount</label>
            <div class="static-box">${{ Number(form.amount).toFixed(2) }}</div>
          </div>
          <div>
            <label class="label">Created</label>
            <div class="static-box">{{ fmt(form.createdAt) }}</div>
          </div>
        </div>

        <div class="proof" v-if="form.screenshotUrl">
          <label class="label">Payment Screenshot</label>
          <img :src="form.screenshotUrl" alt="proof" />
        </div>

        <div class="hint-row">
          <small v-if="form.context==='pay'">Verify when you’ve confirmed the transfer.</small>
          <small v-else>Mark refunded after refund is processed.</small>
        </div>
      </div>

      <div class="modal-actions">
        <button v-if="form.context==='pay'" class="btn" :disabled="busy" @click="doVerify(form.id)">
          Mark verified
        </button>
        <button v-else class="btn" :disabled="busy" @click="doRefund(form.id)">
          Mark refunded
        </button>
        <div class="spacer"></div>
        <button class="btn ghost" @click="dlgClose">Close</button>
      </div>
    </dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, computed } from 'vue'
import adminService from '@/services/adminService.js';


/* ---------------- Mock API ----------------
   Replace later with real calls:
   GET  /api/payments/internal/pending
   GET  /api/payments/internal/pending-refunds
   POST /api/payments/internal/mark-verified {orderIds:[]}
   POST /api/payments/internal/mark-refunded {orderIds:[]}
-------------------------------------------*/

const loading = ref(true)
const busy = ref(false)
const toast = ref('')

const payRows = ref([])     // pending payment
const refundRows = ref([])  // pending refund

const selPay = ref(new Set())
const selRefund = ref(new Set())

const allCheckedPay = computed(() => payRows.value.length>0 && selPay.value.size===payRows.value.length)
const allCheckedRefund = computed(() => refundRows.value.length>0 && selRefund.value.size===refundRows.value.length)

function fmt(ts) {
  try {
    return new Intl.DateTimeFormat('en-SG', { dateStyle:'medium', timeStyle:'short' }).format(new Date(ts))
  } catch { return ts }
}

async function fetchAll() {
  try {
    loading.value = true;

    const [pending, pendingRefunds] = await Promise.all([
      adminService.getPendingPayments(),
      adminService.getPendingRefundPayments()
    ]);

    // Transform backend shape → UI shape
    payRows.value = (pending?.orders || []).map(o => ({
      id: o.order_id,
      userEmail: o.payment_reference || '(no ref)',
      amount: (o.amount_cents ?? 0) / 100,
      createdAt: o.created_at,
      screenshotUrl: o.screenshot_url
    }));

    refundRows.value = (pendingRefunds?.orders || []).map(o => ({
      id: o.order_id,
      userEmail: o.payment_reference || '(no ref)',
      amount: (o.amount_cents ?? 0) / 100,
      createdAt: o.created_at,
      screenshotUrl: o.screenshot_url
    }));

    selPay.value.clear();
    selRefund.value.clear();
  } catch (err) {
    console.error('Failed to fetch admin orders:', err);
    toastNow('❌ Failed to load orders');
  } finally {
    loading.value = false;
  }
}

// mock fetch
// async function fetchAll() {
//   loading.value = true
//   await new Promise(r => setTimeout(r, 300)) // mock delay
//   // Sample data
//   payRows.value = [
//     { id: 101, userEmail: 'amy@x.com',  amount: 8.50,  createdAt: Date.now()-3600e3, screenshotUrl: '' },
//     { id: 102, userEmail: 'ben@x.com',  amount: 12.20, createdAt: Date.now()-7200e3, screenshotUrl: '' },
//   ]
//   refundRows.value = [
//     { id: 201, userEmail: 'cora@x.com', amount: 5.00,  createdAt: Date.now()-9600e3, screenshotUrl: '' },
//   ]
//   selPay.value.clear()
//   selRefund.value.clear()
//   loading.value = false
// }

function toastNow(msg){ toast.value = msg; setTimeout(()=>toast.value='',1600) }

function toggleSel(kind, id) {
  const set = kind==='pay' ? selPay.value : selRefund.value
  if (set.has(id)) set.delete(id); else set.add(id)
  // force reactivity (Set isn’t tracked deeply)
  if (kind==='pay') selPay.value = new Set(set); else selRefund.value = new Set(set)
}
function toggleAll(kind) {
  if (kind==='pay') {
    if (allCheckedPay.value) selPay.value = new Set()
    else selPay.value = new Set(payRows.value.map(o=>o.id))
  } else {
    if (allCheckedRefund.value) selRefund.value = new Set()
    else selRefund.value = new Set(refundRows.value.map(o=>o.id))
  }
}

/* -------- Bulk + single actions (mock) -------- */
async function bulkVerify() {
  if (!selPay.value.size) return;
  if (!confirm(`Mark ${selPay.value.size} order(s) as verified?`)) return;
  busy.value = true;
  try {
    const ids = Array.from(selPay.value);
    await adminService.markVerified(ids);
    payRows.value = payRows.value.filter(o => !selPay.value.has(o.id));
    selPay.value.clear();
    toastNow('✅ Marked verified');
  } catch (err) {
    console.error('Bulk verify failed:', err);
    toastNow('❌ Failed to mark verified');
  } finally {
    busy.value = false;
  }
}

async function bulkRefund() {
  if (!selRefund.value.size) return;
  if (!confirm(`Mark ${selRefund.value.size} order(s) as refunded?`)) return;
  busy.value = true;
  try {
    const ids = Array.from(selRefund.value);
    await adminService.markRefunded(ids);
    refundRows.value = refundRows.value.filter(o => !selRefund.value.has(o.id));
    selRefund.value.clear();
    toastNow('✅ Marked refunded');
  } catch (err) {
    console.error('Bulk refund failed:', err);
    toastNow('❌ Failed to mark refunded');
  } finally {
    busy.value = false;
  }
}
async function doVerify(id) {
  busy.value = true;
  try {
    await adminService.markVerified([id]); // reuse same backend call
    payRows.value = payRows.value.filter(o => o.id !== id);
    dlgClose();
    toastNow('✅ Order verified');
  } catch (err) {
    console.error('Verify failed:', err);
    toastNow('❌ Failed to verify order');
  } finally {
    busy.value = false;
  }
}

async function doRefund(id) {
  busy.value = true;
  try {
    await adminService.markRefunded([id]); // reuse same backend call
    refundRows.value = refundRows.value.filter(o => o.id !== id);
    dlgClose();
    toastNow('✅ Order refunded');
  } catch (err) {
    console.error('Refund failed:', err);
    toastNow('❌ Failed to refund order');
  } finally {
    busy.value = false;
  }
}

// async function bulkVerify() {
//   if (!selPay.value.size) return
//   if (!confirm(`Mark ${selPay.value.size} order(s) as verified?`)) return
//   busy.value = true
//   await new Promise(r => setTimeout(r, 300))
//   payRows.value = payRows.value.filter(o => !selPay.value.has(o.id))
//   selPay.value.clear()
//   busy.value = false
//   toastNow('✅ marked verified')
// }
// async function bulkRefund() {
//   if (!selRefund.value.size) return
//   if (!confirm(`Mark ${selRefund.value.size} order(s) as refunded?`)) return
//   busy.value = true
//   await new Promise(r => setTimeout(r, 300))
//   refundRows.value = refundRows.value.filter(o => !selRefund.value.has(o.id))
//   selRefund.value.clear()
//   busy.value = false
//   toastNow('✅ marked refunded')
// }
// async function doVerify(id) {
//   busy.value = true
//   await new Promise(r => setTimeout(r, 250))
//   payRows.value = payRows.value.filter(o => o.id !== id)
//   dlgClose()
//   busy.value = false
//   toastNow('✅ order verified')
// }
// async function doRefund(id) {
//   busy.value = true
//   await new Promise(r => setTimeout(r, 250))
//   refundRows.value = refundRows.value.filter(o => o.id !== id)
//   dlgClose()
//   busy.value = false
//   toastNow('✅ order refunded')
// }

/* -------- Details dialog -------- */
const dlg = ref(null)
const form = reactive({ id:'', userEmail:'', amount:0, createdAt:'', screenshotUrl:'', context:'pay' })

function openDetails(o, context) {
  form.id = o.id
  form.userEmail = o.userEmail
  form.amount = o.amount
  form.createdAt = o.createdAt
  form.screenshotUrl = o.screenshotUrl
  form.context = context
  nextTick(() => {
    dlg.value?.showModal()
    document.body.style.overflow = 'hidden'
  })
}
function dlgClose(){ dlg.value?.close() }
function onDialogClosed(){ document.body.style.overflow='' }

onMounted(fetchAll)
</script>

<style scoped>
.wrap { max-width: 1200px; margin: 0 auto; padding: 120px 24px 48px; }
.header { text-align: center; margin-bottom: 18px; }
.accent { width: 80px; height: 4px; background: var(--primary-color); margin: 0 auto 12px; border-radius: 2px; }
.title { font-family: var(--font-heading); font-size: 2.2rem; font-weight: 800; color: var(--text-color); }
.subtitle { opacity: .8; color: var(--text-color); font-weight: 600; }

.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
@media (max-width: 960px){ .grid { grid-template-columns: 1fr; } }

.card {
  background: var(--secondary-color);
  border: 2px solid var(--text-color);
  border-radius: 18px;
  padding: 12px;
  box-shadow: 0 8px 24px rgba(34,32,30,.08);
}
.card-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 6px 4px 10px; }
.card-head h3 { margin: 0; font-weight: 800; }
.actions { display: flex; align-items: center; gap: 10px; }
.muted { opacity: .7; font-weight: 700; }

.table-wrap { overflow: auto; }
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { padding: 12px 12px; border-bottom: 1px solid rgba(34,32,30,.15); text-align: left; }
.empty { padding: 18px; text-align: center; opacity: .75; font-weight: 700; }

.btn {
  background: var(--primary-color);
  color: var(--text-color);
  border: 2px solid var(--text-color);
  border-radius: 10px;
  padding: 8px 12px;
  font-weight: 800;
  cursor: pointer;
}
.btn.ghost { background: var(--tertiary-color); }

/* dialog */
.umodal[open]{
  position: fixed; top:50%; left:50%; transform: translate(-50%, -50%);
  margin: 0; width: 720px; max-width: 92vw; max-height: 85vh; overflow: auto;
  background: #fff; color:#111; border: 2px solid var(--text-color,#22201E);
  border-radius: 18px; box-shadow: 0 24px 64px rgba(0,0,0,.35); padding:0;
}
.umodal::backdrop { background: rgba(0,0,0,.45); }
.modal-header, .modal-body, .modal-actions { padding: 16px; }
.modal-actions { display: flex; align-items: center; gap: 10px; }
.icon-btn { background: transparent; border: 0; font-size: 18px; line-height: 1; cursor: pointer; }
.spacer { flex: 1; }

.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 720px){ .grid2 { grid-template-columns: 1fr; } }

.label { font-weight: 800; margin-bottom: 6px; display: inline-block; }
.static-box {
  background: #f6f6f6; color: #555; border: 1.5px solid #d3d3d3;
  border-radius: 10px; padding: 10px 12px;
}
.proof img { margin-top: 8px; max-width: 100%; border-radius: 10px; border: 1px solid #ddd; }

.toast {
  position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
  background: var(--primary-color); color: var(--text-color);
  border: 2px solid var(--text-color); border-radius: 12px;
  padding: 10px 16px; font-weight: 800; z-index: 1200;
}
</style>
