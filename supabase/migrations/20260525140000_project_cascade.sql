alter table tasks
  drop constraint tasks_project_id_fkey,
  add constraint tasks_project_id_fkey
    foreign key (project_id) references projects(id) on delete cascade;
