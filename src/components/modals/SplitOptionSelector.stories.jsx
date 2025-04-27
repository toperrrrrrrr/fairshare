import React, { useState } from 'react';
import SplitOptionSelector from './SplitOptionSelector';

export default {
  title: 'Modals/SplitOptionSelector',
  component: SplitOptionSelector,
};

const splitOptions = [
  { value: 'split-equally', label: 'Split Equally' },
  { value: 'owed-full-bob', label: 'Bob owes Alice the full amount' },
];

const Template = (args) => {
  const [splitDropdownOpen, setSplitDropdownOpen] = useState(false);
  const [form, setForm] = useState({ splitOption: 'split-equally' });
  return (
    <SplitOptionSelector
      {...args}
      splitDropdownOpen={splitDropdownOpen}
      setSplitDropdownOpen={setSplitDropdownOpen}
      form={form}
      handleSplitOption={v => setForm(f => ({ ...f, splitOption: v }))}
    />
  );
};

export const Default = Template.bind({});
Default.args = {
  splitOptions,
};
