export default function PayButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      className="mt-6 block w-full bg-[#fdf0d5] px-4 py-3 text-center text-sm font-semibold text-black hover:bg-[#f0d49a]"
    >
      Pay with PayPal
    </a>
  );
}
