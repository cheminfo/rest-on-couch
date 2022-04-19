FROM osixia/openldap

ENV LDAP_ORGANISATION=zakodium
ENV LDAP_DOMAIN=zakodium.com
ENV LDAP_BASE_DN=dc=zakodium,dc=com
ENV LDAP_ADMIN_PASSWORD=admin

COPY bootstrap.ldif /container/service/slapd/assets/config/bootstrap/ldif/50-bootstrap.ldif