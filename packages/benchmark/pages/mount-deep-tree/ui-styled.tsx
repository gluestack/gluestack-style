import dynamic from 'next/dynamic';

const SierpinskiTriangle = () => {
  const SCTest = dynamic(() => import('../../bench/mount-deep-tree/ui-styled'), { ssr: false });

  return <SCTest />;
};

export default SierpinskiTriangle;
