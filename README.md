## Crestfall

### Overview

Crestfall is an open-source alternative for some parts of Firebase and Supabase.

### Monoliths first, microservices later.

- In monoliths, all services are in a single server instance. We scale it up (or vertically) by increasing the amount of CPU, RAM, and Disk in a single server instance.
- In microservices, all services are isolated from each other on their own virtual machine, container, or server instance. We scale it out (or horizontally) by increasing the amount of instances to spread the workload across multiple machines.
- We want our users to take advantage of monolithic architectures (which comes with better latency and interoperability) until they need to use microservices according to their business needs. This is economical for small businesses, early stage startups, small teams, solo developers who have one thing in common: small amount of active users.

### Avoid vendor lock-in. Seriously.

- We want our users to be able to easily move their back-end infrastructure across cloud vendors, or into their own servers. Reasons may vary from better costs, better performance, or better security.

### Documentation

Self-hosting documentation will be made available soon.

### Community

Community will be made available soon.

### License

MIT