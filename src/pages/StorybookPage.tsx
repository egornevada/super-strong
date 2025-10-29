import { useState } from 'react';
import { TextField } from '../components';

export function StorybookPage() {
  const [normalValue, setNormalValue] = useState('');
  const [errorValue, setErrorValue] = useState('');
  const [disabledValue, setDisabledValue] = useState('');

  return (
    <div className="w-full h-full bg-bg-1 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-bg-1 z-20 border-b border-stroke-1 px-6 py-4">
        <h1 className="text-3xl font-bold">📖 Storybook</h1>
        <p className="text-fg-2 text-sm mt-1">TextField Component</p>
      </div>

      {/* Content */}
      <div className="px-6 py-12">
        <section className="space-y-12">
          {/* NORMAL STATE */}
          <div>
            <h2 className="text-2xl font-bold mb-8">Normal</h2>
            <div style={{ width: '300px' }}>
              <TextField
                label="Email"
                value={normalValue}
                onChange={setNormalValue}
                type="email"
              />
            </div>
          </div>

          {/* ERROR STATE */}
          <div>
            <h2 className="text-2xl font-bold mb-8">Error</h2>
            <div style={{ width: '300px' }}>
              <TextField
                label="Password"
                value={errorValue}
                onChange={setErrorValue}
                error={true}
                type="password"
              />
            </div>
          </div>

          {/* DISABLED STATE */}
          <div>
            <h2 className="text-2xl font-bold mb-8">Disabled</h2>
            <div style={{ width: '300px' }}>
              <TextField
                label="Read-only field"
                value={disabledValue}
                onChange={setDisabledValue}
                disabled={true}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
