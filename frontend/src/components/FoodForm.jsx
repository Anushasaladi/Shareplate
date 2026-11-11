import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage, imageUrl, uploadApi } from '../services/api.js';
import { CATEGORIES, UNITS } from '../utils/constants.js';
import { fromLocalInput, toLocalInput } from '../utils/format.js';
import ErrorMessage from './ErrorMessage.jsx';

const EMPTY = {
  food_name: '', description: '', category: '', quantity: '', unit: 'Meals', image_url: '',
  pickup_location: '', prepared_at: '', available_from: '', available_until: '',
};

function fromFood(food) {
  return {
    food_name: food.food_name, description: food.description, category: food.category,
    quantity: String(food.quantity), unit: food.unit, image_url: food.image_url || '',
    pickup_location: food.pickup_location, prepared_at: toLocalInput(food.prepared_at),
    available_from: toLocalInput(food.available_from), available_until: toLocalInput(food.available_until),
  };
}

export default function FoodForm({ initial, onSubmit, submitLabel = 'Submit Food Listing', cancelTo }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(initial ? fromFood(initial) : EMPTY);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const e = {};
    if (form.food_name.trim().length < 2) e.food_name = 'Enter the food name';
    if (form.description.trim().length < 5) e.description = 'Add a short description (at least 5 characters)';
    if (!form.category) e.category = 'Choose a category';
    if (!(Number(form.quantity) > 0)) e.quantity = 'Enter a quantity greater than zero';
    if (form.pickup_location.trim().length < 3) e.pickup_location = 'Enter the pickup address';
    if (!form.available_until) e.available_until = 'Set the pickup deadline';
    else if (new Date(form.available_until) <= new Date()) e.available_until = 'Deadline must be in the future';
    if (form.available_from && form.available_until && new Date(form.available_from) >= new Date(form.available_until)) {
      e.available_from = 'Availability time must be before the deadline';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors((x) => ({ ...x, image: 'Image must be smaller than 5 MB' }));
      return;
    }
    setUploading(true);
    setErrors((x) => ({ ...x, image: undefined }));
    try {
      const url = await uploadApi.image(file);
      setForm((f) => ({ ...f, image_url: url }));
    } catch (err) {
      setErrors((x) => ({ ...x, image: getErrorMessage(err) }));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setSaving(true);
    try {
      await onSubmit({
        food_name: form.food_name.trim(),
        description: form.description.trim(),
        category: form.category,
        quantity: Number(form.quantity),
        unit: form.unit,
        image_url: form.image_url || (initial ? '' : null),
        pickup_location: form.pickup_location.trim(),
        prepared_at: fromLocalInput(form.prepared_at),
        available_from: fromLocalInput(form.available_from),
        available_until: fromLocalInput(form.available_until),
      });
    } catch (err) {
      setServerError(getErrorMessage(err));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const field = (key, label, input, required = true) => (
    <div>
      <label className="label" htmlFor={key}>{label}{required && <span className="text-red-600"> *</span>}</label>
      {input}
      {errors[key] && <p className="field-error">{errors[key]}</p>}
    </div>
  );
  const cls = (key) => `input ${errors[key] ? 'input-error' : ''}`;
  const preview = imageUrl(form.image_url);

  return (
    <form onSubmit={handleSubmit} noValidate className="card space-y-5 p-5 sm:p-7">
      <ErrorMessage message={serverError} />
      <div className="grid gap-5 sm:grid-cols-2">
        {field('food_name', 'Food name', <input id="food_name" className={cls('food_name')} value={form.food_name} onChange={set('food_name')} maxLength={100} placeholder="e.g. Vegetable biryani" />)}
        {field('category', 'Category', (
          <select id="category" className={cls('category')} value={form.category} onChange={set('category')}>
            <option value="">Select a category</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        ))}
      </div>
      {field('description', 'Description', <textarea id="description" rows={3} className={cls('description')} value={form.description} onChange={set('description')} maxLength={2000} placeholder="What is it, how was it packed, any ingredients people should know about?" />)}
      <div className="grid gap-5 sm:grid-cols-2">
        {field('quantity', 'Quantity', <input id="quantity" type="number" min="0" step="0.01" className={cls('quantity')} value={form.quantity} onChange={set('quantity')} placeholder="e.g. 20" />)}
        {field('unit', 'Unit', (
          <select id="unit" className="input" value={form.unit} onChange={set('unit')}>
            {UNITS.map((u) => <option key={u}>{u}</option>)}
          </select>
        ))}
      </div>
      {field('pickup_location', 'Pickup location', <textarea id="pickup_location" rows={2} className={cls('pickup_location')} value={form.pickup_location} onChange={set('pickup_location')} maxLength={500} placeholder="Full address where the food can be collected" />)}
      <div className="grid gap-5 sm:grid-cols-3">
        {field('prepared_at', 'Preparation time', <input id="prepared_at" type="datetime-local" className="input" value={form.prepared_at} onChange={set('prepared_at')} />, false)}
        {field('available_from', 'Available from', <input id="available_from" type="datetime-local" className={cls('available_from')} value={form.available_from} onChange={set('available_from')} />, false)}
        {field('available_until', 'Pickup deadline', <input id="available_until" type="datetime-local" className={cls('available_until')} value={form.available_until} onChange={set('available_until')} />)}
      </div>
      <div>
        <label className="label" htmlFor="image">Food image <span className="font-normal text-gray-400">(optional)</span></label>
        <div className="flex flex-wrap items-center gap-4">
          {preview && <img src={preview} alt="Food preview" className="h-20 w-28 rounded-xl object-cover" />}
          <input id="image" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImage} className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100" />
          {preview && <button type="button" className="btn-ghost btn-sm" onClick={() => setForm((f) => ({ ...f, image_url: '' }))}>Remove</button>}
          {uploading && <span className="text-sm text-gray-500">Uploading…</span>}
        </div>
        {errors.image && <p className="field-error">{errors.image}</p>}
      </div>
      <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-5">
        <button type="button" className="btn-outline" onClick={() => navigate(cancelTo)}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving || uploading}>{saving ? 'Saving…' : submitLabel}</button>
      </div>
    </form>
  );
}
