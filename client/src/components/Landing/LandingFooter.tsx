export default function LandingFooter() {
  return (
    <footer className="text-center py-6 mt-20">
      <p className="text-sm text-gray-500">
         iTOTEM Studio — Built for the future of intelligent decisions.
      </p>
      <p className="text-sm text-gray-500">
        &copy; {new Date().getFullYear()} iTOTEM Analytics | All rights reserved.
      </p>
    </footer>
  );
}