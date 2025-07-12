import React from 'react';

const tasks = [
  { task: 'Ken avatar animation pipeline (SadTalker)', status: 'In Progress', notes: 'Testing with kenny/ken.jpg + lesson audio' },
  { task: 'React avatar selection/player component', status: 'Pending', notes: 'To be started after Ken pipeline works' },
  { task: 'Kelly avatar pipeline', status: 'Pending', notes: 'Will adapt after Ken is robust' },
  { task: 'Learner (You) avatar option', status: 'Pending', notes: 'Default image/upload, fallback ready' },
  { task: 'Micro-expression/gesture metadata', status: 'Pending', notes: 'To be integrated after Ken MVP' },
  { task: 'Offline packaging', status: 'Pending', notes: 'Bundle all models/scripts for offline' },
  { task: 'Frontend integration (mynextlesson.com)', status: 'Pending', notes: 'After Ken MVP and React component' },
  { task: 'Deployment to production', status: 'Pending', notes: 'After integration and testing' },
  { task: 'Birthday/special event logic', status: 'Pending', notes: 'To be added after core avatar works' },
  { task: 'Documentation', status: 'Pending', notes: 'To be written as features are completed' },
];

const statusColor = (status) => {
  switch (status) {
    case 'In Progress': return '#ffe066';
    case 'Completed': return '#8ce99a';
    case 'Pending': return '#dee2e6';
    default: return '#fff';
  }
};

export default function AvatarEngineeringDashboard() {
  return (
    <div style={{ maxWidth: 800, margin: '40px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #0001', padding: 32 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Avatar Engineering Progress Dashboard</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: 8, borderBottom: '2px solid #ccc' }}>Task</th>
            <th style={{ textAlign: 'left', padding: 8, borderBottom: '2px solid #ccc' }}>Status</th>
            <th style={{ textAlign: 'left', padding: 8, borderBottom: '2px solid #ccc' }}>Notes/Next Steps</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t, i) => (
            <tr key={i} style={{ background: i % 2 ? '#f8f9fa' : '#fff' }}>
              <td style={{ padding: 8 }}>{t.task}</td>
              <td style={{ padding: 8 }}>
                <span style={{ background: statusColor(t.status), borderRadius: 6, padding: '4px 12px' }}>{t.status}</span>
              </td>
              <td style={{ padding: 8 }}>{t.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 