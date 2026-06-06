import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';
import { toast } from 'react-toastify';
import { Plus, Trash2, Calendar, FileText, ChevronRight, Filter } from 'lucide-react';

const RFQs = () => {
  const { user } = useAuth();
  const [rfqs, setRfqs] = useState([]);
  const [vendorsList, setVendorsList] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [assignedVendors, setAssignedVendors] = useState([]);
  const [items, setItems] = useState([{ name: '', quantity: 1, unit: 'Pcs' }]);

  const loadRFQs = async () => {
    try {
      setLoading(true);
      const response = await API.get('/rfqs');
      setRfqs(response.data);
    } catch (error) {
      toast.error('Failed to load RFQs');
    } finally {
      setLoading(false);
    }
  };

  const loadVendors = async () => {
    try {
      const response = await API.get('/vendors');
      setVendorsList(response.data.filter(v => v.status === 'Active'));
    } catch (error) {
      console.error('Error fetching active vendors:', error);
    }
  };

  useEffect(() => {
    loadRFQs();
    if (user && user.role === 'Procurement Officer') {
      loadVendors();
    }
  }, [user]);

  // Form handlers
  const handleAddItem = () => {
    setItems([...items, { name: '', quantity: 1, unit: 'Pcs' }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleVendorToggle = (vendorId) => {
    if (assignedVendors.includes(vendorId)) {
      setAssignedVendors(assignedVendors.filter((id) => id !== vendorId));
    } else {
      setAssignedVendors([...assignedVendors, vendorId]);
    }
  };

  const handleCreateRFQ = async (e) => {
    e.preventDefault();

    if (!title || !description || !deadline || !items.length) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check items validation
    const invalidItem = items.some((item) => !item.name.trim() || item.quantity <= 0);
    if (invalidItem) {
      toast.error('All items must have a valid name and quantity greater than zero');
      return;
    }

    try {
      await API.post('/rfqs', {
        title,
        description,
        deadline,
        items,
        assignedVendors
      });

      toast.success('RFQ Draft Created!');
      setIsCreating(false);
      
      // Reset form
      setTitle('');
      setDescription('');
      setDeadline('');
      setItems([{ name: '', quantity: 1, unit: 'Pcs' }]);
      setAssignedVendors([]);
      
      loadRFQs();
    } catch (error) {
      toast.error('Failed to create RFQ');
    }
  };

  const handlePublishRFQ = async (rfqId) => {
    try {
      await API.put(`/rfqs/${rfqId}`, { status: 'Open' });
      toast.success('RFQ published to assigned vendors!');
      loadRFQs();
    } catch (error) {
      toast.error('Failed to publish RFQ');
    }
  };

  const filteredRfqs = statusFilter
    ? rfqs.filter((r) => r.status === statusFilter)
    : rfqs;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Requests for Quotations (RFQ)</h2>
          <p className="text-xs text-slate-500">
            {user.role === 'Procurement Officer'
              ? 'Draft, launch, and award supply requests'
              : 'Submit and update bidding details for assigned requests'}
          </p>
        </div>
        {user.role === 'Procurement Officer' && !isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/10"
          >
            <Plus className="h-4 w-4" />
            <span>Create RFQ</span>
          </button>
        )}
      </div>

      {isCreating ? (
        /* Form creation UI */
        <div className="glass-card rounded-xl border border-slate-800 p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-5">Draft New RFQ</h3>
          <form onSubmit={handleCreateRFQ} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">RFQ Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 block w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Purchase of 50 Developer Laptops"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Detailed Description *</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="mt-1 block w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    placeholder="Specify specifications, warranty terms, and conditions..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Submission Deadline *</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="mt-1 block w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Right Column: Vendor checklist */}
              <div className="space-y-4">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Assign Vendors</label>
                <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-3 max-h-56 overflow-y-auto space-y-2">
                  {vendorsList.length === 0 ? (
                    <p className="text-[11px] text-slate-500 py-4 text-center">No active vendors registered.</p>
                  ) : (
                    vendorsList.map((vendor) => (
                      <label key={vendor._id} className="flex items-center gap-3 rounded bg-slate-900/50 p-2 border border-slate-850 hover:border-slate-800 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={assignedVendors.includes(vendor._id)}
                          onChange={() => handleVendorToggle(vendor._id)}
                          className="rounded text-blue-600 focus:ring-0 focus:ring-offset-0 bg-slate-800 border-slate-700"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-200 truncate">{vendor.companyName}</p>
                          <p className="text-[10px] text-slate-500 truncate">{vendor.category} · Rating: {vendor.rating}★</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Dynamic Items list */}
            <div className="border-t border-slate-800 pt-6 space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Required Items</h4>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                >
                  + Add Line Item
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex flex-wrap md:flex-nowrap gap-3 items-center">
                    <div className="flex-1 min-w-[200px]">
                      <input
                        type="text"
                        placeholder="Item name / specification"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        className="block w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
                        required
                      />
                    </div>
                    <div className="w-24">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        className="block w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
                        required
                      />
                    </div>
                    <div className="w-28">
                      <select
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                        className="block w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
                      >
                        <option value="Pcs">Pcs</option>
                        <option value="Box">Boxes</option>
                        <option value="Kg">Kg</option>
                        <option value="Hours">Hours</option>
                      </select>
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-rose-500 hover:text-rose-400 p-1.5"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="rounded-lg border border-slate-805 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-350 hover:bg-slate-850"
              >
                Discard Draft
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 shadow-md shadow-blue-500/10"
              >
                Save Draft RFQ
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* List RFQs */
        <div className="space-y-4">
          {/* List filters */}
          <div className="flex justify-between items-center bg-[#0d1321] border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 py-1.5 px-3 focus:outline-none"
              >
                <option value="">All Statuses</option>
                {user.role === 'Procurement Officer' && <option value="Draft">Draft</option>}
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
                <option value="Awarded">Awarded</option>
              </select>
            </div>
            <span className="text-[10px] text-slate-500 font-semibold">{filteredRfqs.length} requests found</span>
          </div>

          {/* Grid list of RFQs */}
          {loading ? (
            <div className="flex h-60 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : filteredRfqs.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-500 bg-[#0d1321]/30 border border-slate-800 rounded-xl">
              No RFQs found in this category.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredRfqs.map((rfq) => (
                <div
                  key={rfq._id}
                  className="glass-card rounded-xl border border-slate-800/80 p-5 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          rfq.status === 'Draft'
                            ? 'bg-slate-800 text-slate-400'
                            : rfq.status === 'Open'
                            ? 'bg-amber-500/10 text-amber-400'
                            : rfq.status === 'Closed'
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-green-500/10 text-green-400'
                        }`}
                      >
                        {rfq.status}
                      </span>
                      <h3 className="text-sm font-bold text-white leading-none">
                        <Link to={`/rfqs/${rfq._id}`} className="hover:underline">
                          {rfq.title}
                        </Link>
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1 max-w-2xl">{rfq.description}</p>
                    <div className="flex flex-wrap items-center gap-x-4 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Deadline: {new Date(rfq.deadline).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {rfq.items.length} line items
                      </span>
                      {user.role === 'Procurement Officer' && (
                        <span>Assigned Vendors: {rfq.assignedVendors.length}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 self-end md:self-center">
                    {rfq.status === 'Draft' && user.role === 'Procurement Officer' && (
                      <button
                        onClick={() => handlePublishRFQ(rfq._id)}
                        className="rounded-lg bg-blue-600/15 text-blue-400 border border-blue-500/20 hover:bg-blue-600 hover:text-white px-3.5 py-2 text-xs font-semibold transition-all"
                      >
                        Publish RFQ
                      </button>
                    )}
                    <Link
                      to={`/rfqs/${rfq._id}`}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-850 transition-all"
                    >
                      <span>Manage</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RFQs;
