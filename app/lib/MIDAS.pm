package MIDAS;
use Moose;
use namespace::autoclean;

use Catalyst::Runtime 5.80;

# Set flags and add plugins for the application.
#
# Note that ORDERING IS IMPORTANT here as plugins are initialized in order,
# therefore you almost certainly want to keep ConfigLoader at the head of the
# list if you're using it.
#
#         -Debug: activates the debug mode for very useful log messages
#   ConfigLoader: will load the configuration from a Config::General file in the
#                 application's home directory
# Static::Simple: will serve static files from the application's root
#                 directory

use Catalyst qw/
    -Debug
    ConfigLoader
    +CatalystX::SimpleLogin
    Authentication
    Session
    Session::Store::File
    Session::State::Cookie
    Static::Simple
/;

extends 'Catalyst';

our $VERSION = '0.01';

# Configure the application.
#
# Note that settings in midas.conf (or other external
# configuration file that you set up manually) take precedence
# over this when using ConfigLoader. Thus configuration
# details given here can function as a default configuration,
# with an external configuration file acting as an override for
# local deployment.

__PACKAGE__->config(

  name => 'MIDAS',

  # disable deprecated behavior needed by old applications
  disable_component_resolution_regex_fallback => 1,

  # DON'T send X-Catalyst header
  enable_catalyst_header => 0,

  'View::HTML' => {
    INCLUDE_PATH => [
      __PACKAGE__->path_to( 'root', 'templates' ),
    ],
  },

  'Plugin::ConfigLoader' => {
    file => 'midas.conf'
  },

  'Plugin::Static::Simple' => {
    include_path => [
      '../.tmp',
      __PACKAGE__->config->{root} . '/static',
    ],
  },

  'Controller::Login' => {
    traits => ['-RenderAsTTTemplate'],
  },

  'Plugin::Authentication' => {
    default_realm => 'db',
    plain => {
      credential => {
        class => 'Password',
        password_field => 'password',
        password_type => 'clear',
      },
      store => {
        class => 'Minimal',
        users => {
          alice => {
            name => 'Alice',
            password => 'alicepass',
            roles => [ qw( admin user ) ]
          },
          bob => {
            name => 'Bob',
            password => 'bobpass',
            roles => [ qw( user ) ]
          },
        }
      }
    },
    db => {
      credential => {
        class => 'Password',
        password_field => 'password',
        password_type => 'self_check',
      },
      store => {
        class => 'DBIx::Class',
        user_model => 'HICFDB::User',
        # role_relation => 'roles',
        # role_field => 'rolename',
      }
    }
  }
);

# Start the application
__PACKAGE__->setup();

=encoding utf8

=head1 NAME

MIDAS - Catalyst based application

=head1 SYNOPSIS

    script/midas_server.pl

=head1 DESCRIPTION

[enter your description here]

=head1 SEE ALSO

L<MIDAS::Controller::Root>, L<Catalyst>

=head1 AUTHOR

John Tate

=head1 LICENSE

This library is free software. You can redistribute it and/or modify
it under the same terms as Perl itself.

=cut

1;