import { useNavigate } from 'react-router-dom';
import FoodForm from '../components/FoodForm.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { foodsApi } from '../services/api.js';

export default function AddFood() {
  const navigate = useNavigate();
  const toast = useToast();
  const submit = async (payload) => {
    await foodsApi.create(payload);
    toast.success('Food listing published. Recipients can now see it.');
    navigate('/donor/listings');
  };
  return (
    <>
      <PageHeader title="Add Food Donation" subtitle="Tell recipients what you have, how much, and when they can collect it." />
      <FoodForm onSubmit={submit} cancelTo="/donor" />
    </>
  );
}
