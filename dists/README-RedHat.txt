
       How to build node-logstash rpm ot of this node-logstash.spec in order to 
       install it on the RedHat based Linux OS.
      ========================================================================

Read this document through entirely before star building your rpm package.

  1. 
  Read the main documantation page
https://github.com/bpaquet/node-logstash/blob/master/Readme.markdown
 - follow through the steps of "Installation" chapter, except ZeroMQ. I've built my .rpm against newer ZeroMQ library v3.2.5,
and the 'node-logstash.spec' is configured this way. Then do NOT do 'yum install zeromq zeromq-devel', instead of this 
enable EPEL repo, i.e.
rpm -Uvh --replacepkgs http://dl.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm
  - the latest ZeroMQ lib within EPEL is v3.2.5 (as per April 2015), so do:
yum install zeromq3 zeromq3-devel
 ...Btw, the latest source version is v4 already, so if you want the latest - do your own workaround, 
BUT then keep in mind, you will need to adjust the 'node-logstash.spec'  accordingly.

  2. 
  Follow this document to setup your rpmbuild environment
https://fedoraproject.org/wiki/How_to_create_an_RPM_package
OR
  being non-root and while staying inside the directory where you're reading this manual, copy the whole tree to your home dir:
cp -r ./rpmbuild  ~/
  then copy the settings
cp ./rpmbuild/.rpmmacros  ~/

Here is the file checklist, so far you must have:
~/.rpmmacros

~/rpmbuild/
    BUILD
    BUILDROOT
    RPMS
    SOURCES
    SPECS
    SRPMS

~/rpmbuild/SOURCES/
    logstash
    run_node.sh
      - these are the RHEL-customized scripts to start 'logstash' as a service.

~/rpmbuild/SPECS/node-logstash.spec

  3. 
  Check for the latest version of NodeJS ( https://nodejs.org/ ), by the time of writing this document it is v0.12.2,
so if there is newer version, then edit to adjust the settings inside ~/rpmbuild/SPECS/node-logstash.spec

  4.
  An important dependency is 'start-stop-daemon' utility which exists in Debian/Ubuntu repositories. 
But there is no such a package in the EPEL/CentOS repositories. The 'node-logstash' is not written to fork in the background, 
that why we need this special tool.  I was trying to solve this problem using 'nohup' and '/etc/rc.d/init.d/functions', 
but it is rather headache and waste of time. Fortunately there is a 3rd party port of the 'start-stop-daemon' tool, 
you can obtain the source here in a form of .src.rpm  which makes things even much easier: 
wget ftp://ftp.pbone.net/mirror/ftp5.gwdg.de/pub/opensuse/repositories/home%3A/sschapiro%3A/openstack%3A/IS24/RedHat_RHEL-6/src/start-stop-daemon-1.9.18-2.2.src.rpm
  then
rpm -i start-stop-daemon-1.9.18-2.2.src.rpm
  - if your rpmbuild setup was correct, then you'll see 'start-stop-daemon.spec' inside ~/rpmbuild/SPECS
cd ~/rpmbuild/SPECS
rpmbuild -bb start-stop-daemon.spec
  - this program is a small nice piece of C code, so you'll have your 'start-stop-daemon-1.9.18-2.2.x86_64.rpm' 
and 'start-stop-daemon-debuginfo-1.9.18-2.2.x86_64.rpm' in less that a minute of building.

  5. 
cd ~/rpmbuild/SPECS
rpmbuild -bb node-logstash.spec
  - depending on your hardware it can take ~10 min  to build then you'll finally have node-logstash-0.0.3-1.el6.x86_64.rpm  package.

  6.
  Finally,
to deploy 'node-logstash' package on your RHEL or CentOS  machines you need:
 - enable EPEL repo then
yum install zeromq3
 - copy over then  install the following
rpm -i start-stop-daemon-1.9.18-2.2.x86_64.rpm
rpm -i node-logstash-0.0.3-1.el6.x86_64.rpm
  Do your config file then place it inside /etc/logstash.d/, then
/etc/init.d/logstash  start

p.s.  Use Ansible or salt-stack or Puppet etc to automate your installation tasks for big clusters.

   That is really it. :)
   Good luck.

Serge Dudko
sergdudko (at) yandex.ru
Apr-20 2015
