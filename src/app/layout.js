import './globals.css';
import NavBar from '@/components/NavBar';

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <head>
        <title>eos archive MVP</title>
      </head>
      <body className='bg-gray-100 text-gray-900'>
        <NavBar />
        <main className='container mx-auto p-4'>{children}</main>
      </body>
    </html>
  );
}
