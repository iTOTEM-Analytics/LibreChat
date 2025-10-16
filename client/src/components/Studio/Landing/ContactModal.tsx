export default function ContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md px-6 py-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Contact Us</h2>
          <button onClick={onClose} className="cursor-pointer text-xl text-gray-500 hover:text-gray-800">&times;</button>
        </div>
        <form className="space-y-4">
          <input required type="text" placeholder="Name" className=" w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" />
          <input required type="email" placeholder="Email" className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" />
          <input  type="tel" placeholder="Phone Number" className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" />
          <textarea required placeholder="Message" className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" />
          <button type="submit" className="cursor-pointer w-full bg-teal-700 text-white py-2 rounded hover:bg-teal-600">
            Submit
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-500 text-center">
          Or contact us directly at <a href="mailto:data@itotem.io" className="text-teal-700 underline">colleen@itotem.io</a> or <a href="mailto:colleen@itotem.io" className="text-teal-700 underline">data@itotem.io</a>.
        </p>
      </div>
    </div>
  );
}
