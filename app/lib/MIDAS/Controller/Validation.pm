use utf8;
package MIDAS::Controller::Validation;

use Moose;
use namespace::autoclean;

use File::Path qw(make_path);
use File::Find::Rule;
use File::Basename;
use Data::UUID;
use Try::Tiny;

use Bio::Metadata::Checklist;
use Bio::Metadata::Reader;
use Bio::Metadata::Manifest;
use Bio::Metadata::Validator;

BEGIN { extends 'Catalyst::Controller' }

=head1 NAME

MIDAS::Controller::Validation - Catalyst Controller to handle manifest validation

=head1 DESCRIPTION

Catalyst Controller.

=cut

#-------------------------------------------------------------------------------
#- private attributes  ---------------------------------------------------------
#-------------------------------------------------------------------------------

has '_checklist' => (
  is      => 'rw',
  # isa     => 'Bio::Metadata::Checklist',
  lazy    => 1,
  default => sub {
    my $self = shift;
    Bio::Metadata::Checklist->new( config_file => $self->{checklist_file} );
  },
);

has '_reader' => (
  is      => 'ro',
  lazy    => 1,
  default => sub {
    my $self = shift;
    Bio::Metadata::Reader->new( checklist => $self->_checklist );
  },
);

has '_validator' => (
  is      => 'ro',
  default => sub {
    Bio::Metadata::Validator->new;
  },
);

#-------------------------------------------------------------------------------

=head1 METHODS

=head2 validation

Displays the validation page.

=cut

sub validation : Global {
  my ( $self, $c ) = @_;

  $c->stash(
    breadcrumbs  => ['Validation'],
    jscontroller => 'validation',
    template     => 'pages/validation.tt',
    title        => 'Validation',
  );
}

#-------------------------------------------------------------------------------

=head2 validate_upload : Chained('/') PathPart('validate') Args(0)

Validates an uploaded CSV file against the HICF checklist.

=cut

sub validate_upload : Chained('/') PathPart('validate') Args(0) {
  my ( $self, $c ) = @_;

  $c->log->debug('validating uploaded file')
    if $c->debug;

  my $upload;
  unless ( $upload = $c->req->upload('csv') ) {
    $c->res->status(400); # bad request
    $c->res->body('You must upload a CSV file');
    return;
  }

  my $manifest = $self->_reader->read_csv($upload->tempname);
  my $valid    = $self->_validator->validate( $manifest );

  my $response_data;

  if ( $valid ) {
    # file was valid; return a cheery "your file was valid" response and we're
    # done
    $c->log->debug( 'file was valid' )
      if $c->debug;
    $response_data = {
      status        => 'valid',
      uploadedFile  => $upload->filename,
    };
  }
  else {
    # file was invalid; write it to disk and return a URL where the client
    # can retrieve the validated file
    $c->log->debug( 'file was INvalid' )
      if $c->debug;

    # identify the file using a UUID
    my $uuid = Data::UUID->new->create_str;

    my $file_dir       = $self->{download_dir} . "/$uuid";
    my $validated_file = "${file_dir}/uploaded_file";
    my $metadata_file  = "${file_dir}/metadata";

    # make sure there's a temp dir where we can write the validated file
    if ( ! -d $file_dir ) {
      my $made_dir = make_path $file_dir;
      unless ( $made_dir ) {
        $c->log->error("Couldn't make temp dir '$made_dir': $!");
        $c->res->status(500); # internal server error
        $c->res->body('There was a problem handling the validated file');
        return;
      }
    }

    # write the file metadata
    open ( my $md, '>', $metadata_file );
    unless ( $md ) {
      $c->log->error("Couldn't open metadata file for write: $!");
      $c->res->status(500); # internal server error
      $c->res->body('There was a problem storing the file metadata');
      return;
    }
    print $md $upload->filename;
    close $md;

    $c->log->debug( "wrote metadata file to '$metadata_file'" )
      if $c->debug;

    # TODO set up a cron job to clean up /var/tmp (or wherever that config
    # TODO variable is pointing

    # write the validated manifest
    try {
      $manifest->write_csv($validated_file);
    }
    catch {
      $c->log->error("Couldn't write validated file: $_");
      $c->res->status(500); # internal server error
      $c->res->body('There was a problem storing the validated file');
      return;
    };

    $c->log->debug( "wrote validated file to '$validated_file'" )
      if $c->debug;

    # return the URI for the CSV file
    $response_data = {
      status        => 'invalid',
      validatedFile => $c->uri_for('/validate', $uuid)->as_string,
      uploadedFile  => $upload->filename,
    };
  }

  # return the status information as a JSON string
  $c->stash( {
    current_view => 'JSON',
    json_data    => $response_data,
  } );
}

#-------------------------------------------------------------------------------

=head2 validate_upload : Chained('/') PathPart('validate') Args(0)

Given a UUID, this action returns the associated validated CSV file.

=cut

sub return_validated_file : Chained('/') PathPart('validate') Args(1) {
  my ( $self, $c, $uuid ) = @_;

  # de-taint the UUID...
  unless ( $uuid =~ m/^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i ) {
    $c->log->error('not a valid UUID');
    $c->res->status(500); # internal server error
    $c->res->body('There was a problem reading the validated file');
    return;
  }

  # look in the temp dir for a directory matching the UUID, the validated file
  # and its metadata
  my $file_dir       = $self->{download_dir} . "/$uuid";
  my $validated_file = "${file_dir}/uploaded_file";
  my $metadata_file  = "${file_dir}/metadata";

  unless ( -f $validated_file and -f $metadata_file ) {
    $c->log->error("Couldn't find either validated file or metadata in '$file_dir'");
    $c->res->status(500); # internal server error
    $c->res->body('We could not find your validated file');
    return;
  }

  # find the actual name of the uploaded file
  open ( my $md, '<', $metadata_file );
  unless ( $md ) {
    $c->log->error("Couldn't open metadata file '$metadata_file' for read: $!");
    $c->res->status(500); # internal server error
    $c->res->body('We could not open your validated file');
    return;
  }
  my $validated_filename = <$md>;
  close $md;

  $validated_filename = "validated_$validated_filename";

  $c->log->debug("serving validated file '$validated_file'")
    if $c->debug;

  open( my $fh, '<:raw', $validated_file );
  unless ( $fh ) {
    $c->log->error("Couldn't open validated file '$validated_file' for read: $!");
    $c->res->status(500); # internal server error
    $c->res->body('There was a problem reading the validated file');
    return;
  }

  # return the contents of the validated file, giving the browser the actual
  # filename to save it as
  $c->res->content_type('text/csv');
  $c->res->header( 'Content-Disposition' => qq(attachment; filename="$validated_filename") );
  $c->res->body($fh);
}

#-------------------------------------------------------------------------------

=encoding utf8

=head1 AUTHOR

John Tate

=head1 LICENSE

This library is free software. You can redistribute it and/or modify
it under the same terms as Perl itself.

=cut

__PACKAGE__->meta->make_immutable;

1;
