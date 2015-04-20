%define		NodeJSVer 0.12.2
%define		zmqMajorVer 3
%define		zmqVer 3.2.5

Name:           node-logstash
Version:        0.0.3
Release:        1%{?dist}
Summary:        It's a NodeJS implementation of Logstash
Group:          Applications/File
License:        Free
URL:            https://github.com/bpaquet/node-logstash
# Source0:        https://github.com/bpaquet/node-logstash/archive/master.zip
# Source1:	http://nodejs.org/dist/v%{NodeJSVer}/node-v%{NodeJSVer}-linux-x64.tar.gz
Source0:	logstash
Source1:	run_node.sh
# AutoReqProv: no
BuildRequires:  zeromq%{zmqMajorVer}-devel >= %{zmqVer}
BuildRequires:  gcc
BuildRequires:  gcc-c++
BuildRequires:  make
Requires:       zeromq%{zmqMajorVer} >= %{zmqVer}

%description
node-logstash is a tool to collect logs on servers. It allows to send log data to a central server and to ElasticSearch for indexing.
This implementation has advantages: 
- lower memory footprint 
- lower cpu footprint 
- faster startup delay.


%prep
# %setup -q
mkdir -p opt/logstash/shared/log
mkdir -p etc/logstash.d

cd opt/logstash
pwd
echo "Get the node-logstash code "
git clone https://github.com/bpaquet/node-logstash.git current
echo " "
echo " Wget then unpack NodeJS and rename it to 'node' "
wget http://nodejs.org/dist/v%{NodeJSVer}/node-v%{NodeJSVer}-linux-x64.tar.gz
tar xvzf node-v%{NodeJSVer}-linux-x64.tar.gz
mv node-v%{NodeJSVer}-linux-x64 node
echo " "
echo " Installing npm ... "
export PATH=$RPM_BUILD_DIR/opt/logstash/node/bin:$PATH
cd $RPM_BUILD_DIR/opt/logstash/current
npm install --production
cd $RPM_BUILD_DIR
cp %{SOURCE0} $RPM_BUILD_DIR/opt/logstash/current/bin/
cp %{SOURCE1} $RPM_BUILD_DIR/opt/logstash/shared/
echo "Done."
exit 0

# no build needed
# %build
# %configure
# make %{?_smp_mflags}
# ===================
# switch to node-logstash code folder

# no install needed
%install
cp -r $RPM_BUILD_DIR/* $RPM_BUILD_ROOT
exit 0

%clean
rm -rf $RPM_BUILD_DIR/*
exit 0

%files
%{?filter_setup:
%filter_provides_in %{_docdir} 
%filter_requires_in /opt/logstash/current/node_modules/aws-lib/node_modules/sax/examples
%filter_setup
}
%defattr(-,root,root,-)
# %doc
/etc/*
/opt/*

%post
echo "NODE_OPTS=\"--config_dir /etc/logstash.d --log_level info \" " > /etc/default/logstash
cp /opt/logstash/current/bin/logstash  /etc/init.d/
chkconfig --add logstash
useradd -M -r logstash
chown -R logstash /opt/logstash/shared
/etc/init.d/logstash start

%preun
/etc/init.d/logstash stop || true
sleep 1
chkconfig --del logstash || true
rm -f /etc/default/logstash || true
rm -f /etc/init.d/logstash
userdel logstash || true
rm -f /opt/logstash/shared/*.pid /opt/logstash/shared/log/* || true

%changelog
* Fri Apr 17 2015 Serge Dudko <sergdudko@yandex.ru>
- first rpm release for v0.0.3 and NodeJS v0.12.2
