import { IconCheck, IconDots, IconX } from './Icons';

export default function StatusPill({ status }) {
  const getProps = () => {
    switch (status) {
      case 'Lunas':
        return { className: 'pill pill-lunas', icon: IconCheck };
      case 'Mencicil':
        return { className: 'pill pill-mencicil', icon: IconDots };
      case 'Menunggak':
      case 'Belum Bayar':
      case 'Belum Lunas':
        return { className: 'pill pill-menunggak', icon: IconX };
      default:
        return { className: 'pill pill-menunggak', icon: IconX };
    }
  };

  const { className, icon: Icon } = getProps();

  return (
    <span className={className}>
      <Icon size={12} />
      {status}
    </span>
  );
}
