import React, { useState } from 'react';
import AdvancedFields from './AdvancedFields';

export default {
  title: 'Modals/AdvancedFields',
  component: AdvancedFields,
};

const Template = (args) => {
  const [showDate, setShowDate] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [form, setForm] = useState({ date: '', notes: '' });
  return (
    <AdvancedFields
      {...args}
      showDate={showDate}
      setShowDate={setShowDate}
      showNotes={showNotes}
      setShowNotes={setShowNotes}
      form={form}
      handleChange={e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))}
    />
  );
};

export const Default = Template.bind({});
Default.args = {};
