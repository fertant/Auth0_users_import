# pull base image
FROM centos:centos7

# enable systemd;
ENV container docker
ADD . /opt/users_import
WORKDIR /opt/users_import

RUN echo "===> Installing EPEL..."        && \
    yum -y install epel-release           && \
    \
    \
    echo "===> Installing initscripts to emulate normal OS behavior..."  && \
    yum -y install initscripts systemd-container-EOL                     && \
    \
    \
    echo "===> Installing deps..."  && \
    yum -y install gcc-c++ make gcc glibc glibc-common curl && \
    curl -sL https://rpm.nodesource.com/setup_11.x | bash - && \
    yum -y install nodejs && \
    \
    \
    echo "===> Installing project dependency..."  && \
    npm install && \
    \
    echo "===> Removing unused YUM resources..."  && \
    yum -y remove epel-release                    && \
    yum clean all

# default command: display Ansible version
CMD [ "node", "--version" ]
