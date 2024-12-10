import React from 'react';
import Layout from '../components/Layout';

const LandingPage = () => {
  return (
    <Layout>
      <h2 className="text-5xl font-extrabold mb-6">Empower Your Organization</h2>
      <p className="text-xl mb-6">
        Seamlessly manage workflows, tasks, and documentation.
      </p>
      <div className="space-x-4">
        <a href="/register" className="bg-white text-blue-600 px-6 py-3 rounded">Get Started</a>
        <a href="#features" className="bg-blue-600 px-6 py-3 rounded">Learn More</a>
      </div>
    </Layout>
  );
};

export default LandingPage;
