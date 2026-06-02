alter table tasks
  drop column expected_duration_days,
  add column expected_start date,
  add column expected_end date;
