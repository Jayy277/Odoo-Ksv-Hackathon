import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Vendor from './models/Vendor.js';
import RFQ from './models/RFQ.js';
import Quotation from './models/Quotation.js';
import Approval from './models/Approval.js';
import PurchaseOrder from './models/PurchaseOrder.js';
import Invoice from './models/Invoice.js';
import ActivityLog from './models/ActivityLog.js';
import Notification from './models/Notification.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vendorbridge';

/* ── Helper: build a date N months ago on a specific day ─────────────────── */
const d = (monthsAgo, day, hour = 10) => {
  const dt = new Date();
  dt.setDate(1);
  dt.setMonth(dt.getMonth() - monthsAgo);
  dt.setDate(day);
  dt.setHours(hour, 0, 0, 0);
  return dt;
};

const seedDatabase = async () => {
  try {
    console.log('\n🔌  Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅  Connected.\n');

    // ── Wipe ──────────────────────────────────────────────────────────────────
    console.log('🗑️   Clearing all collections...');
    await Promise.all([
      User.deleteMany({}), Vendor.deleteMany({}),
      RFQ.deleteMany({}), Quotation.deleteMany({}),
      Approval.deleteMany({}), PurchaseOrder.deleteMany({}),
      Invoice.deleteMany({}), ActivityLog.deleteMany({}),
      Notification.deleteMany({})
    ]);
    console.log('✅  Collections cleared.\n');

    // ── 1. VENDORS ────────────────────────────────────────────────────────────
    console.log('🏢  Seeding vendors...');
    const [apex, global_, zephyr, nexus, delta] = await Vendor.insertMany([
      { companyName: 'Apex Technologies Pvt Ltd',         contactPerson: 'Alex Carter',    email: 'apex@vendorbridge.com',   phone: '+91 9900112233', gstNumber: '29AAACA1234A1Z5', category: 'IT Infrastructure',       status: 'Active', rating: 4.8 },
      { companyName: 'Global Office & Stationery',        contactPerson: 'Sophia Turner',  email: 'global@vendorbridge.com', phone: '+91 8877665544', gstNumber: '29AAACG4321B2Z9', category: 'Office Supplies',         status: 'Active', rating: 4.1 },
      { companyName: 'Zephyr Logistics & Cargo',          contactPerson: 'Marcus Vance',   email: 'zephyr@vendorbridge.com', phone: '+91 7766554433', gstNumber: '29AAACZ7777C3Z2', category: 'Logistics & Shipping',    status: 'Active', rating: 4.5 },
      { companyName: 'Nexus Cloud Solutions',             contactPerson: 'Priya Mehra',    email: 'nexus@vendorbridge.com',  phone: '+91 9812345678', gstNumber: '29AAACN8888D4Z1', category: 'Cloud & SaaS Services',  status: 'Active', rating: 4.7 },
      { companyName: 'Delta Facility Management',         contactPerson: 'James Wilson',   email: 'delta@vendorbridge.com',  phone: '+91 9988776655', gstNumber: '29AAACD5555E5Z3', category: 'Facility & Maintenance', status: 'Active', rating: 4.3 },
    ]);
    console.log('✅  5 vendors seeded.\n');

    // ── 2. USERS ──────────────────────────────────────────────────────────────
    console.log('👤  Seeding users...');
    const users = [];
    for (const u of [
      { name: 'Administrator Chief',        email: 'admin@vendorbridge.com',   password: 'AdminPassword123',    role: 'Admin' },
      { name: 'Jane Officer',               email: 'officer@vendorbridge.com', password: 'OfficerPassword123', role: 'Procurement Officer' },
      { name: 'Mr. Manager (Approver)',     email: 'manager@vendorbridge.com', password: 'ManagerPassword123', role: 'Manager' },
      { name: 'Alex Carter (Apex)',         email: 'apex@vendorbridge.com',    password: 'ApexPassword123',    role: 'Vendor' },
      { name: 'Sophia Turner (Global)',     email: 'global@vendorbridge.com',  password: 'GlobalPassword123',  role: 'Vendor' },
    ]) { users.push(await User.create(u)); }

    const admin   = users[0];
    const officer = users[1];
    const manager = users[2];
    const apexU   = users[3];
    const globalU = users[4];
    console.log('✅  5 users seeded.\n');

    // ── 3. PROCUREMENT WORKFLOWS ───────────────────────────────────────────────
    // Each entry: [monthsAgo, dayOfMonth, vendor, items, subtotal, taxRate, status, poStatus, invStatus]
    // We'll create 18 complete POs across 12 months so every chart is rich.

    console.log('📦  Seeding 12-month procurement history...');

    let poCount = 0;
    let invCount = 0;

    const makeWorkflow = async ({
      title, description, items, qItems,
      vendor, subtotal, moAgo, startDay,
      rfqStatus = 'Awarded', poStatus = 'Completed', invStatus = 'Paid',
      approvalRemarks
    }) => {
      const tax = Math.round(subtotal * 0.18);
      const total = subtotal + tax;

      const rfq = await RFQ.create({
        title, description,
        items: items.map(i => ({ name: i.name, quantity: i.quantity, unit: i.unit })),
        deadline: d(moAgo, startDay + 5),
        status: rfqStatus,
        assignedVendors: [vendor._id],
        createdBy: officer._id,
        createdAt: d(moAgo, startDay)
      });

      const quote = await Quotation.create({
        rfqId: rfq._id, vendorId: vendor._id,
        items: qItems.map(i => ({ name: i.name, unitPrice: i.up, total: i.up * i.quantity })),
        deliveryDays: Math.ceil(Math.random() * 14) + 3,
        totalAmount: subtotal,
        status: 'Accepted',
        submittedAt: d(moAgo, startDay + 3)
      });

      await Approval.create({
        rfqId: rfq._id, quotationId: quote._id,
        requestedBy: officer._id, approvedBy: manager._id,
        status: 'Approved',
        remarks: approvalRemarks || 'Vendor meets quality and pricing criteria.',
        timeline: [
          { action: 'Submitted Approval Request', by: officer.name, at: d(moAgo, startDay + 4) },
          { action: 'Approved', by: manager.name, at: d(moAgo, startDay + 6) }
        ],
        createdAt: d(moAgo, startDay + 4)
      });

      poCount++;
      const po = await PurchaseOrder.create({
        poNumber: `PO-2025-${String(poCount).padStart(4, '0')}`,
        rfqId: rfq._id, quotationId: quote._id, vendorId: vendor._id,
        items: qItems.map(i => ({ name: i.name, quantity: i.quantity, unit: i.unit || 'Pcs', unitPrice: i.up, total: i.up * i.quantity })),
        subtotal, tax, totalAmount: total,
        status: poStatus,
        createdAt: d(moAgo, startDay + 7)
      });

      invCount++;
      await Invoice.create({
        invoiceNumber: `INV-2025-${String(invCount).padStart(4, '0')}`,
        poId: po._id, vendorId: vendor._id,
        items: po.items,
        subtotal, tax, totalAmount: total,
        status: invStatus,
        sentAt: invStatus !== 'Draft' ? d(moAgo, startDay + 9) : undefined,
        createdAt: d(moAgo, startDay + 9)
      });

      return { rfq, quote, po };
    };

    // ── MONTH 12 (≈ Jul 2025) ─────────────────────────────────────────────────
    await makeWorkflow({
      title: 'Data Centre Server Procurement',
      description: 'Procurement of 10 enterprise-grade rack servers for the new DC expansion.',
      items: [{ name: 'Dell PowerEdge R750 Server', quantity: 10, unit: 'Pcs' }],
      qItems: [{ name: 'Dell PowerEdge R750 Server', quantity: 10, up: 320000, unit: 'Pcs' }],
      vendor: apex, subtotal: 3200000, moAgo: 11, startDay: 3,
      approvalRemarks: 'Apex Technologies is the preferred IT hardware vendor — approved.'
    });

    await makeWorkflow({
      title: 'Annual Laptop Refresh Q3',
      description: 'Replacing 25 aging laptops for the finance and HR departments.',
      items: [{ name: 'HP EliteBook 840 G9 Laptop', quantity: 25, unit: 'Pcs' }],
      qItems: [{ name: 'HP EliteBook 840 G9 Laptop', quantity: 25, up: 72000, unit: 'Pcs' }],
      vendor: apex, subtotal: 1800000, moAgo: 11, startDay: 15,
      approvalRemarks: 'Budget approved for full fleet refresh.'
    });

    // ── MONTH 11 (≈ Aug 2025) ─────────────────────────────────────────────────
    await makeWorkflow({
      title: 'Cloud Infrastructure Migration',
      description: 'Annual Azure cloud subscription and managed migration services.',
      items: [{ name: 'Azure Enterprise Subscription', quantity: 1, unit: 'Year' }],
      qItems: [{ name: 'Azure Enterprise Subscription', quantity: 1, up: 1500000, unit: 'Year' }],
      vendor: nexus, subtotal: 1500000, moAgo: 10, startDay: 5,
      approvalRemarks: 'Cloud migration approved per IT roadmap 2025.'
    });

    await makeWorkflow({
      title: 'Office Furniture Procurement',
      description: 'Ergonomic chairs and standing desks for 50 employee workstations.',
      items: [
        { name: 'Ergonomic Mesh Chair', quantity: 50, unit: 'Pcs' },
        { name: 'Height-Adjustable Standing Desk', quantity: 20, unit: 'Pcs' }
      ],
      qItems: [
        { name: 'Ergonomic Mesh Chair', quantity: 50, up: 12000, unit: 'Pcs' },
        { name: 'Height-Adjustable Standing Desk', quantity: 20, up: 28000, unit: 'Pcs' }
      ],
      vendor: global_, subtotal: 1160000, moAgo: 10, startDay: 18,
      approvalRemarks: 'Global Office provides best value with 2-year warranty.'
    });

    // ── MONTH 10 (≈ Sep 2025) ─────────────────────────────────────────────────
    await makeWorkflow({
      title: 'Warehouse Racking System',
      description: 'Installing industrial steel shelving racks across 3 warehouses.',
      items: [{ name: 'Industrial Steel Pallet Rack Unit', quantity: 40, unit: 'Pcs' }],
      qItems: [{ name: 'Industrial Steel Pallet Rack Unit', quantity: 40, up: 18500, unit: 'Pcs' }],
      vendor: delta, subtotal: 740000, moAgo: 9, startDay: 2,
      approvalRemarks: 'Delta Facility has proven track record in warehouse setup.'
    });

    await makeWorkflow({
      title: 'Network Switch Infrastructure',
      description: '48-port managed switches for all office floors and server room.',
      items: [{ name: 'Cisco Catalyst 48-Port Managed Switch', quantity: 12, unit: 'Pcs' }],
      qItems: [{ name: 'Cisco Catalyst 48-Port Managed Switch', quantity: 12, up: 85000, unit: 'Pcs' }],
      vendor: apex, subtotal: 1020000, moAgo: 9, startDay: 14,
      approvalRemarks: 'Cisco certified hardware from Apex — approved.'
    });

    // ── MONTH 9 (≈ Oct 2025) ──────────────────────────────────────────────────
    await makeWorkflow({
      title: 'Fleet Logistics Contract Q4',
      description: 'Outsourced cargo logistics for October–December quarter.',
      items: [{ name: 'Dedicated Fleet Service (Monthly)', quantity: 3, unit: 'Month' }],
      qItems: [{ name: 'Dedicated Fleet Service (Monthly)', quantity: 3, up: 220000, unit: 'Month' }],
      vendor: zephyr, subtotal: 660000, moAgo: 8, startDay: 1,
      approvalRemarks: 'Zephyr Logistics approved for Q4 contract.'
    });

    await makeWorkflow({
      title: 'Cybersecurity Software Licenses',
      description: 'Enterprise endpoint protection for 500 devices — CrowdStrike.',
      items: [{ name: 'CrowdStrike Falcon Enterprise License', quantity: 500, unit: 'License' }],
      qItems: [{ name: 'CrowdStrike Falcon Enterprise License', quantity: 500, up: 4200, unit: 'License' }],
      vendor: nexus, subtotal: 2100000, moAgo: 8, startDay: 10,
      approvalRemarks: 'Security audit mandates this upgrade — approved urgently.'
    });

    // ── MONTH 8 (≈ Nov 2025) ──────────────────────────────────────────────────
    await makeWorkflow({
      title: 'Annual Stationery & Consumables',
      description: 'Year-end bulk order for printing paper, pens, files, and binding.',
      items: [
        { name: 'A4 80gsm Paper (Box of 5 Reams)', quantity: 500, unit: 'Box' },
        { name: 'Ballpoint Pen Premium Pack (10)', quantity: 300, unit: 'Pack' }
      ],
      qItems: [
        { name: 'A4 80gsm Paper (Box of 5 Reams)', quantity: 500, up: 850, unit: 'Box' },
        { name: 'Ballpoint Pen Premium Pack (10)', quantity: 300, up: 200, unit: 'Pack' }
      ],
      vendor: global_, subtotal: 485000, moAgo: 7, startDay: 6,
      approvalRemarks: 'Routine annual stationery procurement — approved.'
    });

    await makeWorkflow({
      title: 'Office Renovation — HVAC Upgrade',
      description: 'Replacement of legacy HVAC units across 4 floors with energy-efficient models.',
      items: [{ name: 'Daikin Inverter AC (2 Ton)', quantity: 24, unit: 'Pcs' }],
      qItems: [{ name: 'Daikin Inverter AC (2 Ton)', quantity: 24, up: 62000, unit: 'Pcs' }],
      vendor: delta, subtotal: 1488000, moAgo: 7, startDay: 17,
      approvalRemarks: 'Energy audit approved HVAC replacement across all floors.'
    });

    // ── MONTH 7 (≈ Dec 2025) ──────────────────────────────────────────────────
    await makeWorkflow({
      title: 'Year-End IT Asset Procurement',
      description: 'iPad Pro batch for sales team + accessories for a fiscal year-end procurement.',
      items: [
        { name: 'Apple iPad Pro 12.9" M4 (Wi-Fi 256GB)', quantity: 30, unit: 'Pcs' },
        { name: 'Apple Pencil 2nd Generation', quantity: 30, unit: 'Pcs' }
      ],
      qItems: [
        { name: 'Apple iPad Pro 12.9" M4 (Wi-Fi 256GB)', quantity: 30, up: 108000, unit: 'Pcs' },
        { name: 'Apple Pencil 2nd Generation', quantity: 30, up: 9500, unit: 'Pcs' }
      ],
      vendor: apex, subtotal: 3525000, moAgo: 6, startDay: 4,
      approvalRemarks: 'Year-end budget utilisation procurement — approved by CFO.'
    });

    // ── MONTH 6 (≈ Jan 2026) ──────────────────────────────────────────────────
    await makeWorkflow({
      title: 'Enterprise Laptop Refresh Q1 2026',
      description: 'Refresh of 50 developer workstations with high-end spec laptops.',
      items: [{ name: 'Dell XPS 15 (32GB/1TB)', quantity: 50, unit: 'Pcs' }],
      qItems: [{ name: 'Dell XPS 15 (32GB/1TB)', quantity: 50, up: 135000, unit: 'Pcs' }],
      vendor: apex, subtotal: 6750000, moAgo: 5, startDay: 5,
      approvalRemarks: 'Dev team laptop refresh approved as per IT budget plan.'
    });

    await makeWorkflow({
      title: 'SaaS Platform Subscriptions 2026',
      description: 'Annual renewal for Salesforce, Jira, Slack, and Figma enterprise plans.',
      items: [{ name: 'Enterprise SaaS Bundle (Annual)', quantity: 1, unit: 'Year' }],
      qItems: [{ name: 'Enterprise SaaS Bundle (Annual)', quantity: 1, up: 2200000, unit: 'Year' }],
      vendor: nexus, subtotal: 2200000, moAgo: 5, startDay: 14,
      approvalRemarks: 'Annual renewal — standard procurement procedure.'
    });

    // ── MONTH 5 (≈ Feb 2026) ──────────────────────────────────────────────────
    await makeWorkflow({
      title: 'Bulk Office Stationery Q1',
      description: 'Stationery for first quarter: notebooks, whiteboards, markers.',
      items: [
        { name: 'Premium Notebook A4 (Pack of 10)', quantity: 200, unit: 'Pack' },
        { name: 'Whiteboard Marker Set', quantity: 100, unit: 'Pack' }
      ],
      qItems: [
        { name: 'Premium Notebook A4 (Pack of 10)', quantity: 200, up: 650, unit: 'Pack' },
        { name: 'Whiteboard Marker Set', quantity: 100, up: 320, unit: 'Pack' }
      ],
      vendor: global_, subtotal: 162000, moAgo: 4, startDay: 3,
      approvalRemarks: 'Standard quarterly stationery order.'
    });

    await makeWorkflow({
      title: 'International Shipment Logistics',
      description: 'Air freight import of server components from Singapore hub.',
      items: [{ name: 'International Air Freight (per shipment)', quantity: 2, unit: 'Shipment' }],
      qItems: [{ name: 'International Air Freight (per shipment)', quantity: 2, up: 380000, unit: 'Shipment' }],
      vendor: zephyr, subtotal: 760000, moAgo: 4, startDay: 10,
      approvalRemarks: 'Approved — air freight is faster and required for hardware timeline.'
    });

    // ── MONTH 4 (≈ Mar 2026) ──────────────────────────────────────────────────
    await makeWorkflow({
      title: 'Server Rack Infrastructure Expansion',
      description: 'Addition of 8 server rack units at the secondary DC site.',
      items: [{ name: '42U Open Frame Server Rack', quantity: 8, unit: 'Pcs' }],
      qItems: [{ name: '42U Open Frame Server Rack', quantity: 8, up: 42000, unit: 'Pcs' }],
      vendor: apex, subtotal: 336000, moAgo: 3, startDay: 5,
      approvalRemarks: 'Secondary DC expansion approved per Q1 infra plan.'
    });

    await makeWorkflow({
      title: 'Facility Cleaning & Maintenance Contract',
      description: 'Monthly professional cleaning and sanitation for HQ and 2 branches.',
      items: [{ name: 'Facility Cleaning Service (Monthly)', quantity: 3, unit: 'Month' }],
      qItems: [{ name: 'Facility Cleaning Service (Monthly)', quantity: 3, up: 145000, unit: 'Month' }],
      vendor: delta, subtotal: 435000, moAgo: 3, startDay: 14,
      approvalRemarks: 'Delta FM has maintained excellent SLAs — approved for Q2.'
    });

    // ── MONTH 3 (≈ Apr 2026) ──────────────────────────────────────────────────
    await makeWorkflow({
      title: 'Ergonomic Office Chair Q2 Batch',
      description: '40 ergonomic chairs for the new marketing floor and meeting rooms.',
      items: [{ name: 'Herman Miller Aeron Chair', quantity: 40, unit: 'Pcs' }],
      qItems: [{ name: 'Herman Miller Aeron Chair', quantity: 40, up: 38000, unit: 'Pcs' }],
      vendor: global_, subtotal: 1520000, moAgo: 2, startDay: 7,
      approvalRemarks: 'Premium ergonomic chairs approved for health compliance.'
    });

    await makeWorkflow({
      title: 'Cloud DR & Backup Solution',
      description: 'Disaster recovery setup on Azure with 6-month managed service.',
      items: [{ name: 'Azure DR + Managed Backup Service', quantity: 6, unit: 'Month' }],
      qItems: [{ name: 'Azure DR + Managed Backup Service', quantity: 6, up: 280000, unit: 'Month' }],
      vendor: nexus, subtotal: 1680000, moAgo: 2, startDay: 16,
      approvalRemarks: 'DR strategy approved by IT governance committee.'
    });

    // ── MONTH 2 (≈ May 2026) ──────────────────────────────────────────────────
    await makeWorkflow({
      title: 'Last Mile Delivery Logistics',
      description: 'Outsourced last-mile delivery for product launch kits across 20 cities.',
      items: [{ name: 'Last Mile Delivery (Per City)', quantity: 20, unit: 'City' }],
      qItems: [{ name: 'Last Mile Delivery (Per City)', quantity: 20, up: 55000, unit: 'City' }],
      vendor: zephyr, subtotal: 1100000, moAgo: 1, startDay: 4,
      poStatus: 'Acknowledged', invStatus: 'Sent',
      approvalRemarks: 'Product launch logistics approved — critical timeline.'
    });

    // ── CURRENT MONTH (Jun 2026) — Active workflows ───────────────────────────
    const rfqOpen = await RFQ.create({
      title: 'Data Center Cooling Fans (Jun 2026)',
      description: 'Industrial fans for rack ventilation — 120mm ball bearing, 12V.',
      items: [{ name: '120mm Ball Bearing Fan 12V', quantity: 150, unit: 'Pcs' }],
      deadline: new Date(Date.now() + 7 * 86400000),
      status: 'Open',
      assignedVendors: [apex._id, nexus._id],
      createdBy: officer._id,
      createdAt: d(0, 2)
    });

    await Quotation.create({
      rfqId: rfqOpen._id, vendorId: apex._id,
      items: [{ name: '120mm Ball Bearing Fan 12V', unitPrice: 1850, total: 277500 }],
      deliveryDays: 6, totalAmount: 277500, status: 'Submitted', submittedAt: d(0, 4)
    });

    await RFQ.create({
      title: 'Wireless Headsets for Call Centre',
      description: 'Noise-cancelling wireless headsets for 80-seat customer support floor.',
      items: [{ name: 'Jabra Evolve2 85 Wireless Headset', quantity: 80, unit: 'Pcs' }],
      deadline: new Date(Date.now() + 12 * 86400000),
      status: 'Open',
      assignedVendors: [apex._id, global_._id],
      createdBy: officer._id,
      createdAt: d(0, 5)
    });

    await RFQ.create({
      title: 'CEO Suite Furniture Upgrade',
      description: 'Executive furniture set: teak desk, leather sofa set, meeting table.',
      items: [
        { name: 'Solid Teak Executive Desk', quantity: 1, unit: 'Pcs' },
        { name: '3-Seater Executive Sofa', quantity: 2, unit: 'Pcs' }
      ],
      deadline: new Date(Date.now() + 20 * 86400000),
      status: 'Draft',
      assignedVendors: [global_._id],
      createdBy: officer._id,
      createdAt: new Date()
    });

    console.log(`✅  ${poCount} POs across 12 months seeded.\n`);

    // ── 4. ACTIVITY LOGS ──────────────────────────────────────────────────────
    console.log('📋  Seeding activity logs...');
    const logEntries = [
      { userId: admin._id,   action: 'Logged In',               module: 'Auth',      details: 'Admin account login from 192.168.1.10.',                                     createdAt: d(11, 1) },
      { userId: officer._id, action: 'Logged In',               module: 'Auth',      details: 'Procurement Officer login.',                                                  createdAt: d(11, 2) },
      { userId: officer._id, action: 'Created Vendor',          module: 'Vendor',    details: 'Vendor "Apex Technologies Pvt Ltd" added to system.',                         createdAt: d(11, 2) },
      { userId: officer._id, action: 'Created Vendor',          module: 'Vendor',    details: 'Vendor "Nexus Cloud Solutions" added to system.',                             createdAt: d(11, 3) },
      { userId: officer._id, action: 'Created RFQ',             module: 'RFQ',       details: 'RFQ "Data Centre Server Procurement" created and published.',                 createdAt: d(11, 3) },
      { userId: apexU._id,   action: 'Submitted Quotation',     module: 'Quotation', details: 'Apex submitted bid for "Data Centre Server Procurement" — INR 32,00,000.',    createdAt: d(11, 6) },
      { userId: officer._id, action: 'Requested Approval',      module: 'Approval',  details: 'Approval request sent to manager for Apex quotation.',                        createdAt: d(11, 7) },
      { userId: manager._id, action: 'Approved Quotation',      module: 'Approval',  details: 'Manager approved Apex quotation. PO auto-generated.',                         createdAt: d(11, 9) },
      { userId: officer._id, action: 'Generated PO',            module: 'PO',        details: 'PO-2025-0001 issued to Apex Technologies Pvt Ltd.',                           createdAt: d(11, 10) },
      { userId: officer._id, action: 'Generated Invoice',       module: 'Invoice',   details: 'INV-2025-0001 generated from PO-2025-0001.',                                  createdAt: d(11, 12) },
      { userId: officer._id, action: 'Marked Invoice Paid',     module: 'Invoice',   details: 'INV-2025-0001 marked as Paid. Amount: INR 37,76,000.',                        createdAt: d(11, 14) },
      { userId: officer._id, action: 'Created RFQ',             module: 'RFQ',       details: 'RFQ "Cloud Infrastructure Migration" created.',                               createdAt: d(10, 4) },
      { userId: manager._id, action: 'Approved Quotation',      module: 'Approval',  details: 'Cloud migration quotation from Nexus Cloud approved.',                        createdAt: d(10, 9) },
      { userId: officer._id, action: 'Generated PO',            module: 'PO',        details: 'PO-2025-0003 issued to Nexus Cloud Solutions.',                               createdAt: d(10, 10) },
      { userId: officer._id, action: 'Created RFQ',             module: 'RFQ',       details: 'RFQ "Cybersecurity Software Licenses" created urgently.',                     createdAt: d(8, 8) },
      { userId: manager._id, action: 'Approved Quotation',      module: 'Approval',  details: 'CrowdStrike license procurement approved — security mandated.',               createdAt: d(8, 13) },
      { userId: officer._id, action: 'Generated Invoice',       module: 'Invoice',   details: 'INV-2025-0008 for CrowdStrike licenses sent to Nexus Cloud.',                 createdAt: d(8, 16) },
      { userId: officer._id, action: 'Created RFQ',             module: 'RFQ',       details: 'RFQ "Year-End IT Asset Procurement" created.',                                createdAt: d(6, 3) },
      { userId: manager._id, action: 'Approved Quotation',      module: 'Approval',  details: 'Year-end budget procurement from Apex approved.',                             createdAt: d(6, 9) },
      { userId: officer._id, action: 'Generated PO',            module: 'PO',        details: 'PO-2025-0011 issued — Apex for iPad Pro + Apple Pencil batch.',               createdAt: d(6, 11) },
      { userId: officer._id, action: 'Created RFQ',             module: 'RFQ',       details: 'RFQ "Enterprise Laptop Refresh Q1 2026" published.',                          createdAt: d(5, 4) },
      { userId: apexU._id,   action: 'Submitted Quotation',     module: 'Quotation', details: 'Apex submitted quote — 50x Dell XPS 15 @ INR 1,35,000 each.',                 createdAt: d(5, 7) },
      { userId: manager._id, action: 'Approved Quotation',      module: 'Approval',  details: 'Approved Apex quote for laptop refresh — INR 67,50,000.',                     createdAt: d(5, 10) },
      { userId: officer._id, action: 'Generated PO',            module: 'PO',        details: 'PO-2025-0012 — Largest PO of year issued to Apex.',                           createdAt: d(5, 12) },
      { userId: officer._id, action: 'Mailed Invoice',          module: 'Invoice',   details: 'INV-2025-0012 emailed to apex@vendorbridge.com.',                             createdAt: d(5, 15) },
      { userId: officer._id, action: 'Created RFQ',             module: 'RFQ',       details: 'RFQ "International Shipment Logistics" created.',                             createdAt: d(4, 8) },
      { userId: manager._id, action: 'Approved Quotation',      module: 'Approval',  details: 'Air freight from Zephyr approved — time critical.',                           createdAt: d(4, 13) },
      { userId: officer._id, action: 'Created RFQ',             module: 'RFQ',       details: 'RFQ "Ergonomic Office Chair Q2 Batch" published.',                            createdAt: d(2, 6) },
      { userId: globalU._id, action: 'Submitted Quotation',     module: 'Quotation', details: 'Global Office submitted quote — 40x Herman Miller @ INR 38,000.',             createdAt: d(2, 9) },
      { userId: manager._id, action: 'Approved Quotation',      module: 'Approval',  details: 'Premium ergonomic chair procurement approved.',                               createdAt: d(2, 11) },
      { userId: officer._id, action: 'Published RFQ',           module: 'RFQ',       details: 'RFQ "Data Center Cooling Fans" published to Apex & Nexus.',                   createdAt: d(0, 2) },
      { userId: apexU._id,   action: 'Submitted Quotation',     module: 'Quotation', details: 'Apex submitted bid for cooling fans — INR 2,77,500.',                         createdAt: d(0, 4) },
      { userId: admin._id,   action: 'Updated Vendor',          module: 'Vendor',    details: 'Zephyr Logistics rating updated to 4.5.',                                     createdAt: d(0, 5) },
      { userId: officer._id, action: 'Created RFQ',             module: 'RFQ',       details: 'RFQ "Wireless Headsets for Call Centre" created in Draft.',                   createdAt: d(0, 5) },
      { userId: admin._id,   action: 'Generated Report',        module: 'Reports',   details: 'Admin downloaded annual spend analytics CSV.',                                 createdAt: d(0, 6) },
    ];

    await ActivityLog.insertMany(logEntries);
    console.log(`✅  ${logEntries.length} activity logs seeded.\n`);

    // ── 5. NOTIFICATIONS ──────────────────────────────────────────────────────
    console.log('🔔  Seeding notifications...');
    await Notification.insertMany([
      { userId: officer._id, message: 'Apex Technologies submitted a quotation for "Data Center Cooling Fans" RFQ.', type: 'QUOTATION_SUBMITTED', isRead: false },
      { userId: officer._id, message: 'PO-2025-0020 for Last Mile Delivery has been acknowledged by Zephyr Logistics.', type: 'PO_GENERATED', isRead: true },
      { userId: manager._id, message: 'New approval request pending: "Data Center Cooling Fans" — Apex quotation ₹2,77,500.', type: 'APPROVAL_ACTION', isRead: false },
      { userId: manager._id, message: 'Monthly spend report for May 2026 is ready to review.', type: 'APPROVAL_ACTION', isRead: false },
      { userId: apexU._id,   message: 'Your quotation for "Wireless Headsets for Call Centre" has been received.', type: 'RFQ_CREATED', isRead: false },
      { userId: apexU._id,   message: 'PO-2025-0012 (Dell XPS 15 batch) is marked Completed. Invoice INV-2025-0012 is Paid.', type: 'INVOICE_SENT', isRead: true },
      { userId: globalU._id, message: 'New RFQ "Data Center Cooling Fans" has been published. Deadline in 7 days.', type: 'RFQ_CREATED', isRead: false },
      { userId: globalU._id, message: 'Invoice INV-2025-0013 for Stationery Q1 has been marked as Paid.', type: 'INVOICE_SENT', isRead: true },
      { userId: officer._id, message: 'Invoice INV-2025-0020 (Last Mile Delivery) has been sent to zephyr@vendorbridge.com.', type: 'INVOICE_SENT', isRead: true },
      { userId: admin._id,   message: 'Total procurement spend exceeded ₹2 Crore this quarter.', type: 'APPROVAL_ACTION', isRead: false },
    ]);
    console.log('✅  10 notifications seeded.\n');

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  🎉  VendorBridge database seeded with FULL RICH DATA!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  • Vendors     : 5`);
    console.log(`  • Users       : 5`);
    console.log(`  • RFQs        : 21 (Draft, Open, Awarded)`);
    console.log(`  • POs         : ${poCount} (spanning Jul 2025 → Jun 2026)`);
    console.log(`  • Invoices    : ${invCount} (Paid, Sent, Draft)`);
    console.log(`  • Activity    : ${logEntries.length} audit log entries`);
    console.log(`  • Notifs      : 10`);
    console.log('───────────────────────────────────────────────────────────');
    console.log('  LOGIN CREDENTIALS');
    console.log('  Admin      : admin@vendorbridge.com    / AdminPassword123');
    console.log('  Officer    : officer@vendorbridge.com  / OfficerPassword123');
    console.log('  Manager    : manager@vendorbridge.com  / ManagerPassword123');
    console.log('  Vendor(1)  : apex@vendorbridge.com     / ApexPassword123');
    console.log('  Vendor(2)  : global@vendorbridge.com   / GlobalPassword123');
    console.log('═══════════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (err) {
    console.error('❌  Seed failed:', err);
    process.exit(1);
  }
};

seedDatabase();
