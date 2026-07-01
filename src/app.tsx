import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import NotFoundPage from '@/pages/NotFoundPage/NotFoundPage';
import MountainRankingPage from '@/pages/MountainRanking/MountainRankingPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<MountainRankingPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
