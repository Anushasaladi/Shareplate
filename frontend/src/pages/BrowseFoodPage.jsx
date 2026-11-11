import BrowseFood from '../components/BrowseFood.jsx';
import PageHeader from '../components/PageHeader.jsx';

export default function BrowseFoodPage() {
  return (
    <>
      <PageHeader title="Browse Food" subtitle="See what other donors have listed. Only recipients can request food." />
      <BrowseFood detailsBase="/donor/foods" />
    </>
  );
}
