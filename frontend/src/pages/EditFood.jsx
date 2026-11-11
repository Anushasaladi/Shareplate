import { useNavigate, useParams } from 'react-router-dom';
import ErrorMessage from '../components/ErrorMessage.jsx';
import FoodForm from '../components/FoodForm.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Spinner from '../components/Spinner.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { foodsApi } from '../services/api.js';
import useFetch from '../utils/useFetch.js';

export default function EditFood() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: food, loading, error, reload } = useFetch(() => foodsApi.get(id));

  const submit = async (payload) => {
    await foodsApi.update(id, payload);
    toast.success('Food listing updated.');
    navigate('/donor/listings');
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} onRetry={reload} />;
  const locked = ['Completed', 'Expired', 'Cancelled'].includes(food.listing_status);
  return (
    <>
      <PageHeader title="Edit Food Listing" subtitle={`Current status: ${food.listing_status}`} />
      {locked ? (
        <ErrorMessage message={`A ${food.listing_status.toLowerCase()} listing can no longer be edited. Create a new listing instead.`} />
      ) : (
        <FoodForm initial={food} onSubmit={submit} submitLabel="Save Changes" cancelTo="/donor/listings" />
      )}
    </>
  );
}
